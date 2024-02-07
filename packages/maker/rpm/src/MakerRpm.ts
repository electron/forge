import path from 'path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';

import { MakerRpmConfig } from './Config';

function renameRpm(dest: string, _src: string): string {
  return path.join(dest, '<%= name %>-<%= version %>-<%= revision %>.<%= arch === "aarch64" ? "arm64" : arch %>.rpm');
}

export function rpmArch(nodeArch: ForgeArch): string {
  switch (nodeArch) {
    case 'ia32':
      return 'i386';
    case 'x64':
      return 'x86_64';
    case 'arm64':
      return 'aarch64';
    case 'armv7l':
      return 'armv7hl';
    case 'arm':
      return 'armv6hl';
    default:
      return nodeArch;
  }
}

export default class MakerRpm extends MakerBase<MakerRpmConfig> {
  name = 'rpm';

  defaultPlatforms: ForgePlatform[] = ['linux'];

  requiredExternalBinaries: string[] = ['rpmbuild'];

  isSupportedOnCurrentPlatform(): boolean {
    return this.isInstalled('electron-installer-redhat');
  }

  async make({ dir, makeDir, targetArch }: MakerOptions): Promise<string[]> {
    // eslint-disable-next-line node/no-missing-require
    const installer = require('electron-installer-redhat');

    const outDir = path.resolve(makeDir, 'rpm', targetArch);

    await this.ensureDirectory(outDir);
    const { packagePaths } = await installer({
      ...this.config,
      arch: rpmArch(targetArch),
      src: dir,
      dest: outDir,
      rename: renameRpm,
    });
    return packagePaths;
  }
}

export { MakerRpm, MakerRpmConfig };
