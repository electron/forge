import path from 'path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';

import { MakerDebConfig } from './Config';

export function debianArch(nodeArch: ForgeArch): string {
  switch (nodeArch) {
    case 'ia32':
      return 'i386';
    case 'x64':
      return 'amd64';
    case 'armv7l':
      return 'armhf';
    case 'arm':
      return 'armel';
    default:
      return nodeArch;
  }
}

export default class MakerDeb extends MakerBase<MakerDebConfig> {
  name = 'deb';

  defaultPlatforms: ForgePlatform[] = ['linux'];

  requiredExternalBinaries: string[] = ['dpkg', 'fakeroot'];

  isSupportedOnCurrentPlatform(): boolean {
    return this.isInstalled('electron-installer-debian');
  }

  async make({ dir, makeDir, targetArch }: MakerOptions): Promise<string[]> {
    // eslint-disable-next-line node/no-missing-require
    const installer = require('electron-installer-debian');

    const outDir = path.resolve(makeDir, 'deb', targetArch);

    await this.ensureDirectory(outDir);
    const { packagePaths } = await installer({
      options: {},
      ...this.config,
      arch: debianArch(targetArch),
      src: dir,
      dest: outDir,
      rename: undefined,
    });

    return packagePaths;
  }
}

export { MakerDeb, MakerDebConfig };
