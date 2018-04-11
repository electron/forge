import InstallerBase from '@electron-forge/installer-base';

import { spawnSync } from 'child_process';
import pify from 'pify';
import sudoPrompt from 'sudo-prompt';

export default class InstallerLinux extends InstallerBase {
  which = async (type, prog, promise) => {
    if (spawnSync('which', [prog]).status === 0) {
      await promise;
    } else {
      throw new Error(`${prog} is required to install ${type} packages`);
    }
  }

  sudo = (type, program, args) =>
    this.which(
      type,
      program,
      pify(sudoPrompt.exec)(`${program} ${args}`, { name: 'Electron Forge' }),
    );
}
