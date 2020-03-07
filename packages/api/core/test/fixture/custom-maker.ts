import { ForgePlatform } from '@electron-forge/shared-types';
import MakerBase from '@electron-forge/maker-base';

interface Config {
  artifactPath: string;
}

export default class Maker extends MakerBase<Config> {
  name = 'custom-maker';

  defaultPlatforms = ['linux'] as ForgePlatform[];

  isSupportedOnCurrentPlatform() {
    return true;
  }

  async make() {
    return Promise.resolve([this.config.artifactPath || 'default']);
  }
}
