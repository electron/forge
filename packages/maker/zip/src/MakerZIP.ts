import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify, styleText } from 'node:util';

import { writeJson } from '@electron-forge/core-utils';
import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import { spawn } from '@malept/cross-spawn-promise';
import { zip } from 'cross-zip';

import { MakerZIPConfig, MakerZIPDeltaConfig } from './Config.js';
import {
  createBinaryDelta,
  digestFile,
  downloadFile,
  findAppBundle,
  findGroupOrOtherWritable,
  getBinaryDelta,
  readBundleVersion,
} from './mac-delta.js';

type SquirrelMacRelease = {
  version: string;
  updateTo: {
    version: string;
    pub_date: string;
    notes: string;
    name: string;
    url: string;
    /**
     * Lowercase hex SHA-256 of the file at `url`, verified by Squirrel.Mac
     * before installing.
     */
    sha256?: string;
    /**
     * Size in bytes of the file at `url`, verified by Squirrel.Mac before
     * installing.
     */
    size?: number;
    /**
     * A binary delta from the release before this one, which Squirrel.Mac
     * downloads instead of `url` when the running app's CFBundleVersion is
     * `from_version`.
     */
    delta?: SquirrelMacDelta;
  };
};

type SquirrelMacDelta = {
  from_version: string;
  url: string;
  sha256: string;
  size: number;
};

type SquirrelMacReleases = {
  currentRelease: string;
  releases: SquirrelMacRelease[];
};

function warn(message: string) {
  console.warn(
    styleText('yellow', '⚠'),
    styleText('yellow', `WARNING: ${message}`),
  );
}

export default class MakerZIP extends MakerBase<MakerZIPConfig> {
  name = 'zip';

  defaultPlatforms: ForgePlatform[] = ['darwin', 'mas', 'win32', 'linux'];

  isSupportedOnCurrentPlatform(): boolean {
    return true;
  }

  async make({
    dir,
    makeDir,
    appName,
    packageJSON,
    targetArch,
    targetPlatform,
  }: MakerOptions): Promise<string[]> {
    const zipDir = ['darwin', 'mas'].includes(targetPlatform)
      ? path.resolve(dir, `${appName}.app`)
      : dir;

    const zipName = `${path.basename(dir)}-${packageJSON.version}.zip`;
    const zipPath = path.resolve(
      makeDir,
      'zip',
      targetPlatform,
      targetArch,
      zipName,
    );

    await this.ensureFile(zipPath);
    await promisify(zip)(zipDir, zipPath);

    // Only generate RELEASES.json for darwin builds (not MAS)
    if (targetPlatform === 'darwin' && this.config.macUpdateManifestBaseUrl) {
      const parsed = new URL(this.config.macUpdateManifestBaseUrl);
      parsed.pathname += '/RELEASES.json';
      const response = await fetch(parsed.toString());
      let currentValue: SquirrelMacReleases = {
        currentRelease: '',
        releases: [],
      };
      if (response.status === 200) {
        currentValue = (await response.json()) as SquirrelMacReleases;
      }
      const updateUrl = new URL(this.config.macUpdateManifestBaseUrl);
      updateUrl.pathname += `/${zipName}`;
      currentValue.releases = currentValue.releases || [];
      const previousRelease = currentValue.releases.find(
        (release) => release.version === currentValue.currentRelease,
      );
      // Remove existing release if it is already in the manifest
      currentValue.releases = currentValue.releases.filter(
        (release) => release.version !== packageJSON.version,
      );
      // Add the current version as the current release
      currentValue.currentRelease = packageJSON.version;
      const release: SquirrelMacRelease = {
        version: packageJSON.version,
        updateTo: {
          name: `${appName} v${packageJSON.version}`,
          version: packageJSON.version,
          pub_date: new Date().toISOString(),
          url: updateUrl.toString(),
          notes: this.config.macUpdateReleaseNotes || '',
          ...(await digestFile(zipPath)),
        },
      };
      currentValue.releases.push(release);

      const artifacts = [zipPath];
      if (this.config.macUpdateDelta) {
        const result = await this.makeMacDelta({
          appPath: zipDir,
          baseUrl: this.config.macUpdateManifestBaseUrl,
          previousRelease,
          version: packageJSON.version,
          baseName: path.basename(dir),
          outDir: path.dirname(zipPath),
        });
        if (result) {
          release.updateTo.delta = result.delta;
          artifacts.push(result.deltaPath);
        }
      }

      const releasesPath = path.resolve(
        makeDir,
        'zip',
        targetPlatform,
        targetArch,
        'RELEASES.json',
      );
      await this.ensureFile(releasesPath);
      await writeJson(releasesPath, currentValue);

      return [...artifacts, releasesPath];
    }

    return [zipPath];
  }

  /**
   * Create a binary delta from `previousRelease` to the app at `appPath`,
   * or return `undefined` (after logging why) if it should be skipped or
   * cannot be created and `strict` is not set.
   */
  private async makeMacDelta({
    appPath,
    baseUrl,
    previousRelease,
    version,
    baseName,
    outDir,
  }: {
    appPath: string;
    baseUrl: string;
    previousRelease: SquirrelMacRelease | undefined;
    version: string;
    baseName: string;
    outDir: string;
  }): Promise<{ delta: SquirrelMacDelta; deltaPath: string } | undefined> {
    const options: MakerZIPDeltaConfig =
      typeof this.config.macUpdateDelta === 'object'
        ? this.config.macUpdateDelta
        : {};

    if (process.platform !== 'darwin') {
      warn(
        'macUpdateDelta requires a macOS host; publishing this release without a delta.',
      );
      return undefined;
    }
    if (!previousRelease) {
      warn(
        'macUpdateDelta: RELEASES.json has no current release to create a delta from.',
      );
      return undefined;
    }
    if (previousRelease.version === version) {
      warn(
        `macUpdateDelta: the current release in RELEASES.json is already ${version}; not creating a delta to itself.`,
      );
      return undefined;
    }

    const deltaName = `${baseName}-${previousRelease.version}-to-${version}.delta`;
    const deltaPath = path.resolve(outDir, deltaName);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'forge-zip-delta-'));
    try {
      const previousZip = path.join(tmpDir, 'previous.zip');
      await downloadFile(previousRelease.updateTo.url, previousZip, {
        sha256: previousRelease.updateTo.sha256,
        size: previousRelease.updateTo.size,
      });
      const previousDir = path.join(tmpDir, 'previous');
      await spawn('ditto', ['-x', '-k', previousZip, previousDir]);
      const previousApp = await findAppBundle(previousDir);

      for (const app of [previousApp, appPath]) {
        const writable = await findGroupOrOtherWritable(app);
        if (writable.length > 0) {
          throw new Error(
            `${app} contains group- or other-writable files, so a delta would stop applying after the first update ` +
              `(Squirrel.Mac removes those permissions on install). Remove them before signing, ` +
              `e.g. with "chmod -R go-w" on the bundle in a packageAfterCopy hook. Files:\n` +
              writable.slice(0, 10).join('\n') +
              (writable.length > 10
                ? `\n...and ${writable.length - 10} more`
                : ''),
          );
        }
      }

      const fromVersion = await readBundleVersion(previousApp);
      const binaryDelta = await getBinaryDelta(options.binaryDeltaPath);
      await this.ensureFile(deltaPath);
      const scratchDir = path.join(tmpDir, 'check');
      await fs.mkdir(scratchDir);
      await createBinaryDelta(
        binaryDelta,
        previousApp,
        appPath,
        deltaPath,
        scratchDir,
      );

      const deltaUrl = new URL(baseUrl);
      deltaUrl.pathname += `/${deltaName}`;
      return {
        delta: {
          from_version: fromVersion,
          url: deltaUrl.toString(),
          ...(await digestFile(deltaPath)),
        },
        deltaPath,
      };
    } catch (err) {
      await fs.rm(deltaPath, { force: true });
      const message = `Failed to create a delta update from ${previousRelease.version} to ${version}`;
      if (options.strict) {
        throw new Error(message, { cause: err });
      }
      warn(
        `${message}; publishing this release without one.\n${err instanceof Error ? err.message : err}`,
      );
      return undefined;
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
}

export { MakerZIP, MakerZIPConfig, MakerZIPDeltaConfig };
