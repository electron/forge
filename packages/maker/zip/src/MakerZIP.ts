import path from 'path';
import { promisify } from 'util';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import got from 'got';

import { MakerZIPConfig } from './Config';

type SquirrelMacRelease = {
  version: string;
  updateTo: {
    version: string;
    pub_date: string;
    notes: string;
    name: string;
    url: string;
  };
};

type SquirrelMacReleases = {
  currentRelease: string;
  releases: SquirrelMacRelease[];
};

export default class MakerZIP extends MakerBase<MakerZIPConfig> {
  name = 'zip';

  defaultPlatforms: ForgePlatform[] = ['darwin', 'mas', 'win32', 'linux'];

  isSupportedOnCurrentPlatform(): boolean {
    return true;
  }

  async make({ dir, makeDir, appName, packageJSON, targetArch, targetPlatform }: MakerOptions): Promise<string[]> {
    const { zip } = require('cross-zip');

    const zipDir = ['darwin', 'mas'].includes(targetPlatform) ? path.resolve(dir, `${appName}.app`) : dir;

    const zipName = `${path.basename(dir)}-${packageJSON.version}.zip`;
    const zipPath = path.resolve(makeDir, 'zip', targetPlatform, targetArch, zipName);

    await this.ensureFile(zipPath);
    await promisify(zip)(zipDir, zipPath);

    // Only generate RELEASES.json for darwin builds (not MAS)
    if (targetPlatform === 'darwin' && this.config.macUpdateManifestBaseUrl) {
      const parsed = new URL(this.config.macUpdateManifestBaseUrl);
      parsed.pathname += '/RELEASES.json';
      const response = await got.get(parsed.toString(), {
        throwHttpErrors: false,
      });
      let currentValue: SquirrelMacReleases = {
        currentRelease: '',
        releases: [],
      };
      if (response.statusCode === 200) {
        currentValue = JSON.parse(response.body);
      }
      const updateUrl = new URL(this.config.macUpdateManifestBaseUrl);
      updateUrl.pathname += `/${zipName}`;
      // Remove existing release if it is already in the manifest
      currentValue.releases = currentValue.releases || [];
      currentValue.releases = currentValue.releases.filter((release) => release.version !== packageJSON.version);
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
        },
      });

      const releasesPath = path.resolve(makeDir, 'zip', targetPlatform, targetArch, 'RELEASES.json');
      await this.ensureFile(releasesPath);
      await fs.writeJson(releasesPath, currentValue);

      return [zipPath, releasesPath];
    }

    return [zipPath];
  }
}

export { MakerZIP, MakerZIPConfig };
