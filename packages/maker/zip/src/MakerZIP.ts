import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';

import { writeJson } from '@electron-forge/core-utils';
import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import { zip } from 'cross-zip';

import { MakerZIPConfig } from './Config.js';

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
  };
};

type SquirrelMacReleases = {
  currentRelease: string;
  releases: SquirrelMacRelease[];
};

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  await pipeline(createReadStream(filePath), hash);
  return hash.digest('hex');
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
      // Remove existing release if it is already in the manifest
      currentValue.releases = currentValue.releases || [];
      currentValue.releases = currentValue.releases.filter(
        (release) => release.version !== packageJSON.version,
      );
      // Add the current version as the current release
      currentValue.currentRelease = packageJSON.version;
      currentValue.releases.push({
        version: packageJSON.version,
        updateTo: {
          name: `${appName} v${packageJSON.version}`,
          version: packageJSON.version,
          pub_date: new Date().toISOString(),
          url: updateUrl.toString(),
          notes: this.config.macUpdateReleaseNotes || '',
          sha256: await sha256File(zipPath),
          size: (await fs.stat(zipPath)).size,
        },
      });

      const releasesPath = path.resolve(
        makeDir,
        'zip',
        targetPlatform,
        targetArch,
        'RELEASES.json',
      );
      await this.ensureFile(releasesPath);
      await writeJson(releasesPath, currentValue);

      return [zipPath, releasesPath];
    }

    return [zipPath];
  }
}

export { MakerZIP, MakerZIPConfig };
