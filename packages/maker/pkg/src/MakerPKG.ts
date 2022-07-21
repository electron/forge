import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import { flatAsync } from 'electron-osx-sign';

import path from 'path';
import { MakerPKGConfig } from './Config';

export default class MakerDMG extends MakerBase<MakerPKGConfig> {
  name = 'pkg';

  defaultPlatforms: ForgePlatform[] = ['darwin', 'mas'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'darwin';
  }

  async make({ dir, makeDir, appName, packageJSON, targetPlatform }: MakerOptions): Promise<string[]> {
    if (!['darwin', 'mas'].includes(targetPlatform)) {
      throw new Error(`The pkg maker only supports targetting "mas" and "darwin" builds.  You provided "${targetPlatform}"`);
    }

    const outPath = path.resolve(makeDir, `${appName}-${packageJSON.version}.pkg`);

    await this.ensureFile(outPath);

    const pkgConfig = {
      ...this.config,
      app: path.resolve(dir, `${appName}.app`),
      pkg: outPath,
      platform: targetPlatform,
    };
    await flatAsync(pkgConfig);

    return [outPath];
  }
}

export { MakerPKGConfig };
