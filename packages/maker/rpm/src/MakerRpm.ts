import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';
import path from 'path';

import { MakerRpmConfig } from './Config';

export function rpmArch(nodeArch: ForgeArch) {
  switch (nodeArch) {
    case 'ia32': return 'i386';
    case 'x64': return 'x86_64';
    case 'armv7l': return 'armv7hl';
    case 'arm': return 'armv6hl';
    default: return nodeArch;
  }
}

export default class MakerRpm extends MakerBase<MakerRpmConfig> {
  name = 'rpm';

  defaultPlatforms: ForgePlatform[] = ['linux'];

  isSupportedOnCurrentPlatform() {
    return this.isInstalled('electron-installer-redhat') && this.externalBinariesExist(['rpmbuild']);
  }

  async make({
    dir,
    makeDir,
    targetArch,
  }: MakerOptions) {
    // eslint-disable-next-line global-require, import/no-unresolved
    const installer = require('electron-installer-redhat');

    const outDir = path.resolve(makeDir);

    await this.ensureDirectory(outDir);
    const { packagePaths } = await installer({
      ...this.config,
      arch: rpmArch(targetArch),
      src: dir,
      dest: outDir,
      rename: undefined,
    });
    return packagePaths;
  }
}
