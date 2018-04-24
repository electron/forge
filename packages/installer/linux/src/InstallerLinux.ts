import InstallerBase, { InstallerOptions } from '@electron-forge/installer-base';

import { spawnSync } from 'child_process';
import pify from 'pify';
import sudoPrompt from 'sudo-prompt';

export { InstallerOptions };

export default abstract class InstallerLinux extends InstallerBase {
  which = async (type: string, prog: string, promise: () => Promise<any>) => {
    if (spawnSync('which', [prog]).status === 0) {
      await promise();
    } else {
      throw new Error(`${prog} is required to install ${type} packages`);
    }
  }

  sudo = (type: string, program: string, args: string) =>
    this.which(
      type,
      program,
      () => pify(sudoPrompt.exec)(`${program} ${args}`, { name: 'Electron Forge' }),
    );
}
