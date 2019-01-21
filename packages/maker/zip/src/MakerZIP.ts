import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import path from 'path';
import pify from 'pify';

export type MakerZIPConfig = {};

export default class MakerZIP extends MakerBase<MakerZIPConfig> {
  name = 'zip';

  defaultPlatforms: ForgePlatform[] = ['darwin', 'mas', 'win32', 'linux'];

  // eslint-disable-next-line class-methods-use-this
  isSupportedOnCurrentPlatform() {
    return true;
  }

  async make({
    dir,
    makeDir,
    appName,
    packageJSON,
    targetPlatform,
  }: MakerOptions) {
    // eslint-disable-next-line global-require
    const { zip } = require('cross-zip');

    const zipDir = ['darwin', 'mas'].includes(targetPlatform) ? path.resolve(dir, `${appName}.app`) : dir;

    const zipPath = path.resolve(makeDir, `${path.basename(dir)}-${packageJSON.version}.zip`);

    await this.ensureFile(zipPath);
    await pify(zip)(zipDir, zipPath);

    return [zipPath];
  }
}
