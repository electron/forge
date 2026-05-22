import fs from 'node:fs/promises';
import path from 'node:path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import { MakerDMGConfig } from './Config.js';

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
    targetPlatform,
  }: MakerOptions): Promise<string[]> {
    const { createDMG } = await import('electron-installer-dmg');

    const dmgDir = path.resolve(makeDir, 'dmg', targetArch);
    const outPath = path.resolve(dmgDir, `${this.config.name || appName}.dmg`);
    const forgeDefaultOutPath = path.resolve(
      dmgDir,
      `${appName}-${packageJSON.version}-${targetArch}.dmg`,
    );

    await this.ensureFile(outPath);
    const dmgConfig: ElectronInstallerDMGOptions = {
      overwrite: true,
      name: appName,
      ...this.config,
      appPath: path.resolve(dir, `${appName}.app`),
      out: dmgDir,
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
