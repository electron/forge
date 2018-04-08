import MakerBase from '@electron-forge/maker-base';

import path from 'path';
import pify from 'pify';

export function rpmArch(nodeArch) {
  switch (nodeArch) {
    case 'ia32': return 'i386';
    case 'x64': return 'x86_64';
    case 'armv7l': return 'armv7hl';
    case 'arm': return 'armv6hl';
    default: return nodeArch;
  }
}

export default class MakerRpm extends MakerBase {
  name = 'rpm';

  isSupportedOnCurrentPlatform() {
    return this.isInstalled('electron-installer-redhat') && process.platform === 'linux';
  }

  async make({
    dir,
    makeDir,
    targetArch,
    packageJSON,
  }) {
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
    });

    await pify(installer)(rpmConfig);
    return [outPath];
  }
}
