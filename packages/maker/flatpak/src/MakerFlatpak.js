import MakerBase from '@electron-forge/maker-base';

import fs from 'fs-extra';
import path from 'path';
import pify from 'pify';

export function flatpakArch(nodeArch) {
  switch (nodeArch) {
    case 'ia32': return 'i386';
    case 'x64': return 'x86_64';
    case 'armv7l': return 'arm';
    // arm => arm
    default: return nodeArch;
  }
}

export default class MakerFlatpak extends MakerBase {
  name = 'flatpak';

  isSupportedOnCurrentPlatform() {
    return this.isInstalled('electron-installer-flatpak') && process.platform === 'linux';
  }

  async make({
    dir,
    makeDir,
    targetArch,
  }) {
    const installer = require('electron-installer-flatpak');

    const arch = flatpakArch(targetArch);
    const outDir = path.resolve(makeDir, 'flatpak');

    await this.ensureDirectory(outDir);
    const flatpakConfig = Object.assign({}, this.config, {
      arch,
      src: dir,
      dest: outDir,
    });

    await pify(installer)(flatpakConfig);

    return (await fs.readdir(outDir))
      .filter(basename => basename.endsWith('.flatpak'))
      .map(basename => path.join(outDir, basename));
  }
}
