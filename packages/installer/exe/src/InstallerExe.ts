import InstallerBase, { InstallerOptions } from '@electron-forge/installer-base';

import opn from 'opn';

export default class InstallerExe extends InstallerBase {
  name = 'exe';

  // eslint-disable-next-line class-methods-use-this
  async install({
    filePath,
  }: InstallerOptions) {
    await opn(filePath, { wait: false });
  }
}
