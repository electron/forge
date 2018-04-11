import InstallerLinux from '@electron-forge/installer-linux';

export default class InstallerDeb extends InstallerLinux {
  constructor() {
    super('deb');
  }

  async install({
    filePath,
  }) {
    await this.sudo('Debian', 'gdebi', `-n ${filePath}`);
  }
}
