import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';
import path from 'path';

import { MakerDebConfig } from './Config';

export function debianArch(nodeArch: ForgeArch) {
  switch (nodeArch) {
    case 'ia32': return 'i386';
    case 'x64': return 'amd64';
    case 'armv7l': return 'armhf';
    case 'arm': return 'armel';
    default: return nodeArch;
  }
}

export default class MakerDeb extends MakerBase<MakerDebConfig> {
  name = 'deb';

  defaultPlatforms: ForgePlatform[] = ['linux'];

  isSupportedOnCurrentPlatform() {
    return this.isInstalled('electron-installer-debian') && process.platform === 'linux';
  }

  async make({
    dir,
    makeDir,
    targetArch,
    packageJSON,
  }: MakerOptions) {
    // eslint-disable-next-line global-require
    const installer = require('electron-installer-debian');

    const arch = debianArch(targetArch);
    const name = (this.config.options || {}).name || packageJSON.name;
    const versionedName = `${name}_${installer.transformVersion(packageJSON.version)}_${arch}`;
    const outPath = path.resolve(makeDir, `${versionedName}.deb`);

    await this.ensureFile(outPath);

    await installer(Object.assign({
      options: {},
    }, this.config, {
      arch,
      src: dir,
      dest: path.dirname(outPath),
      rename: undefined,
    }));

    return [outPath];
  }
}
