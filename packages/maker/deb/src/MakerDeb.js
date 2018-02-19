import MakerBase from '@electron-forge/maker-base';

import path from 'path';

export function debianArch(nodeArch) {
  switch (nodeArch) {
    case 'ia32': return 'i386';
    case 'x64': return 'amd64';
    case 'armv7l': return 'armhf';
    case 'arm': return 'armel';
    default: return nodeArch;
  }
}

export default class MakerDeb extends MakerBase {
  constructor() {
    super('dmg');
  }

  isSupportedOnCurrentPlatform() {
    return this.isInstalled('electron-installer-debian') && process.platform === 'linux';
  }

  async make({
    dir,
    makeDir,
    targetArch,
    config,
    packageJSON,
  }) {
    const installer = require('electron-installer-debian');

    const arch = debianArch(targetArch);
    const name = (config.options || {}).name || packageJSON.name;
    const versionedName = `${name}_${packageJSON.version}_${arch}`;
    const outPath = path.resolve(makeDir, `${versionedName}.deb`);

    await this.ensureFile(outPath);

    await installer(Object.assign({
      options: {},
    }, config, {
      src: dir,
      dest: path.dirname(outPath),
      arch,
    }));

    return [outPath];
  }
}
