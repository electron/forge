import path from 'node:path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';

import { MakerDebConfig } from './Config.js';

/**
 * Converts the Node.js architecture value of the processor architecture
 * into a string accepted by `electron-installer-debian`.
 *
 * @param nodeArch - Node.js architecture string
 * @returns - electron-installer-debian architecture string
 */
export function debianArch(nodeArch: ForgeArch): string {
  switch (nodeArch) {
    case 'ia32':
      return 'i386';
    case 'x64':
      return 'amd64';
    case 'arm64':
      return 'arm64';
    case 'armv7l':
      return 'armhf';
    case 'mips64el':
      return 'mips64el';
    default:
      throw new Error(`Unsupported architecture ${nodeArch}`);
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
    // @ts-expect-error: this package has no types
    const { default: installer } = await import('electron-installer-debian');

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
