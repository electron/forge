import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import { flatAsync } from '@electron/osx-sign';

import path from 'path';
import { MakerPKGConfig } from './Config';

type flatAsyncOptions = Parameters<typeof flatAsync>[0];

export default class MakerPKG extends MakerBase<MakerPKGConfig> {
  name = 'pkg';

  defaultPlatforms: ForgePlatform[] = ['darwin', 'mas'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'darwin';
  }

  async make({ dir, makeDir, appName, packageJSON, targetPlatform }: MakerOptions): Promise<string[]> {
    if (!this.isValidTargetPlatform(targetPlatform)) {
      throw new Error(`The pkg maker only supports targeting "mas" and "darwin" builds. You provided "${targetPlatform}".`);
    }

    const outPath = path.resolve(makeDir, `${appName}-${packageJSON.version}.pkg`);

    await this.ensureFile(outPath);

    const pkgConfig: flatAsyncOptions = {
      ...this.config,
      app: path.resolve(dir, `${appName}.app`),
      pkg: outPath,
      platform: targetPlatform,
    };should pass through correct default
    await flatAsync(pkgConfig);

    return [outPath];
  }

  private isValidTargetPlatform(platform: string): platform is 'darwin' | 'mas' {
    return this.defaultPlatforms.includes(platform);
  }
}

export { MakerPKGConfig };
