import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import path from 'path';

import { MakerSnapConfig } from './Config';

export default class MakerSnap extends MakerBase<MakerSnapConfig> {
  name = 'snap';
  defaultPlatforms: ForgePlatform[] = ['linux'];

  isSupportedOnCurrentPlatform() {
    return process.platform === 'linux';
  }

  async make({
    dir,
    makeDir,
    targetArch,
  }: MakerOptions) {
    const installer = require('electron-installer-snap');

    const outPath = path.resolve(makeDir, 'snap');

    await this.ensureDirectory(outPath);

    const snapDefaults = {
      arch: targetArch,
      dest: outPath,
      src: dir,
    };
    const snapConfig = Object.assign({}, this.config, snapDefaults);

    return [await installer(snapConfig)];
  }
}
