import path from 'node:path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import fs from 'fs-extra';

import { MakerDMGConfig } from './Config';

import type { ElectronInstallerDMGOptions } from 'electron-installer-dmg';

export default class MakerDMG extends MakerBase<MakerDMGConfig> {
  name = 'dmg';

  defaultPlatforms: ForgePlatform[] = ['darwin', 'mas'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'darwin';
  }

  async make({
    dir,
    makeDir,
    appName,
    packageJSON,
    targetArch,
  }: MakerOptions): Promise<string[]> {
    const { createDMG } = require('electron-installer-dmg');

    const outPath = path.resolve(makeDir, `${this.config.name || appName}.dmg`);
    const forgeDefaultOutPath = path.resolve(
      makeDir,
      `${appName}-${packageJSON.version}-${targetArch}.dmg`,
    );

    await this.ensureFile(outPath);
    // Escape appName and appPath by wrapping them in quotes.
    // This avoids macOS treating spaces as argument separators during
    // DMG creation (fixes issue #4055).
    const escapedAppPath = `"${path.resolve(dir, `${appName}.app`)}"`;
    const dmgConfig: ElectronInstallerDMGOptions = {
      overwrite: true,
      name: `"${appName}"`, // escaped name
      ...this.config,
      appPath: escapedAppPath, // escaped app path
      out: path.dirname(outPath),
    };
    await createDMG(dmgConfig);
    if (!this.config.name) {
      await this.ensureFile(forgeDefaultOutPath);
      await fs.rename(outPath, forgeDefaultOutPath);
      return [forgeDefaultOutPath];
    }

    return [outPath];
  }
}

export { MakerDMG, MakerDMGConfig };
