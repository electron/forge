import path from 'node:path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import { MakerSnapConfig } from './Config';

export default class MakerSnap extends MakerBase<MakerSnapConfig> {
  name = 'snap';

  defaultPlatforms: ForgePlatform[] = ['linux'];

  requiredExternalBinaries: string[] = ['snapcraft'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'linux';
  }

  async make({ dir, makeDir, targetArch }: MakerOptions): Promise<string[]> {
    const installer = require('electron-installer-snap');

    const outPath = path.resolve(makeDir, 'snap', targetArch);

    await this.ensureDirectory(outPath);

    const snapDefaults = {
      arch: targetArch,
      dest: outPath,
      src: dir,
    };
    const snapConfig = { ...this.config, ...snapDefaults };

    return [await installer(snapConfig)];
  }
}

export { MakerSnap, MakerSnapConfig };
