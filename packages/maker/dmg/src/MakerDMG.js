import MakerBase from '@electron-forge/maker-base';

import fs from 'fs-extra';
import path from 'path';
import pify from 'pify';

export default class MakerDMG extends MakerBase {
  name = 'dmg';

  isSupportedOnCurrentPlatform() {
    return process.platform === 'darwin';
  }

  async make({
    dir,
    makeDir,
    appName,
    packageJSON,
  }) {
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
