import path from 'path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import { MakerDMGConfig } from './Config';

export default class MakerDMG extends MakerBase<MakerDMGConfig> {
  name = 'dmg';

  defaultPlatforms: ForgePlatform[] = ['darwin', 'mas'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'darwin';
  }

  async make({ dir, makeDir, appName, packageJSON, targetArch }: MakerOptions): Promise<string[]> {
    const electronDMG = require('electron-installer-dmg');

    const dmgOutName = this.config.name ?? `${appName}-${packageJSON.version}-${targetArch}.dmg`;
    const outPath = path.resolve(makeDir, dmgOutName);

    await this.ensureFile(outPath);
    const dmgConfig = {
      overwrite: true,
      ...this.config,
      appPath: path.resolve(dir, `${appName}.app`),
      out: path.dirname(outPath),
      name: dmgOutName,
      title: this.config.name ?? appName,
    };
    const opts = await electronDMG(dmgConfig);

    return [opts.dmgPath];
  }
}

export { MakerDMG, MakerDMGConfig };
