import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import { MakerDMGConfig } from './Config';

import fs from 'fs-extra';
import path from 'path';
import pify from 'pify';

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
    const wantedOutPath = path.resolve(makeDir, `${appName}-${packageJSON.version}.dmg`);
    await this.ensureFile(outPath);
    const dmgConfig = Object.assign({
      overwrite: true,
      name: appName,
    }, this.config, {
      appPath: path.resolve(dir, `${appName}.app`),
      out: path.dirname(outPath),
    });
    await pify(electronDMG)(dmgConfig);
    if (!this.config.name) {
      await fs.rename(outPath, wantedOutPath);
    }
    return [wantedOutPath];
  }
}
