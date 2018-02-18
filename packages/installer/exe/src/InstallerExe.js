import InstallerBase from '@electron-forge/installer-base';

import opn from 'opn';

export default class InstallerExe extends InstallerBase {
  constructor() {
    super('exe');
  }

  async install({
    filePath,
  }) {
    return opn(filePath, { wait: false });
  }
}
