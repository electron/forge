import InstallerLinux, { InstallerOptions } from '@electron-forge/installer-linux';

export default class InstallerDeb extends InstallerLinux {
  name = 'deb';

  async install({ filePath }: InstallerOptions): Promise<void> {
    await this.sudo('Debian', 'gdebi', `-n ${filePath}`);
  }
}

export { InstallerOptions };
