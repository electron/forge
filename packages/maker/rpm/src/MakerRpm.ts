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
    return this.isInstalled('electron-installer-redhat') && process.platform === 'linux';
  }

  async make({
    dir,
    makeDir,
    targetArch,
    packageJSON,
  }: MakerOptions) {
    // eslint-disable-next-line global-require
    const installer = require('electron-installer-redhat');

    const arch = rpmArch(targetArch);
    const name = (this.config.options || {}).name || packageJSON.name;
    const versionedName = `${name}-${packageJSON.version}.${arch}`;
    const outPath = path.resolve(makeDir, `${versionedName}.rpm`);

    await this.ensureFile(outPath);
    const rpmConfig = Object.assign({}, this.config, {
      arch,
      src: dir,
      dest: path.dirname(outPath),
      rename: undefined,
    });

    await installer(rpmConfig);
    return [outPath];
  }
}
