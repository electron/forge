import MakerBase from '@electron-forge/maker-base';

import path from 'path';

export default class MakerSnap extends MakerBase {
  constructor() {
    super('snap');
  }

  isSupportedOnCurrentPlatform() {
    return process.platform === 'linux';
  }

  async make({
    dir,
    makeDir,
    targetArch,
    config,
  }) {
    const installer = require('electron-installer-snap');

    const outPath = path.resolve(makeDir, 'snap');

    await this.ensureDirectory(outPath);

    const snapDefaults = {
      arch: targetArch,
      dest: outPath,
      src: dir,
    };
    const snapConfig = Object.assign({}, config, snapDefaults);

    return [await installer(snapConfig)];
  }
}
