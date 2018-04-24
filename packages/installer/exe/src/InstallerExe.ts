import InstallerBase, { InstallerOptions } from '@electron-forge/installer-base';

import opn from 'opn';

export default class InstallerExe extends InstallerBase {
  name = 'exe';

  async install({
    filePath,
  }: InstallerOptions) {
    await opn(filePath, { wait: false });
  }
}
