import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import { MakerDMGConfig } from './Config';

import fs from 'fs-extra';
import path from 'path';

export default class MakerDMG extends MakerBase<MakerDMGConfig> {
  name = 'dmg';
  defaultPlatforms: ForgePlatform[] = ['darwin', 'mas'];

  isSupportedOnCurrentPlatform() {
    return process.platform === 'darwin';
  }

  async make({
    dir,
    makeDir,
    appName,
    packageJSON,
  }: MakerOptions) {
    const electronDMG = require('electron-installer-dmg');

    const outPath = path.resolve(makeDir, `${this.config.name || appName}.dmg`);
    const forgeDefaultOutPath = path.resolve(makeDir, `${appName}-${packageJSON.version}.dmg`);

    await this.ensureFile(outPath);
    const dmgConfig = Object.assign({
      overwrite: true,
      name: appName,
    }, this.config, {
      appPath: path.resolve(dir, `${appName}.app`),
      out: path.dirname(outPath),
    });
    const opts = await electronDMG.p(dmgConfig);
    if (!this.config.name) {
      await this.ensureFile(forgeDefaultOutPath);
      await fs.rename(outPath, forgeDefaultOutPath);
      return [forgeDefaultOutPath];
    }

    return [opts.dmgPath];
  }
}
