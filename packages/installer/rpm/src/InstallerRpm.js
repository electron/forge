import InstallerLinux from '@electron-forge/installer-linux';

export default class InstallerRpm extends InstallerLinux {
  constructor() {
    super('rpm');
  }

  async install({
    filePath,
  }) {
    await this.sudo('RPM', 'dnf', `--assumeyes --nogpgcheck install ${filePath}`);
  }
}
