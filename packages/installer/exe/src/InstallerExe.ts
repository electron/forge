import InstallerBase, { InstallerOptions } from '@electron-forge/installer-base';

import open from 'open';

export default class InstallerExe extends InstallerBase {
  name = 'exe';

  async install({ filePath }: InstallerOptions): Promise<void> {
    await open(filePath, { wait: false });
  }
}

export { InstallerOptions };
