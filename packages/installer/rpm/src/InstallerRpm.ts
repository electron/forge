import InstallerLinux, { InstallerOptions } from '@electron-forge/installer-linux';

export default class InstallerRpm extends InstallerLinux {
  name = 'rpm';

  async install({ filePath }: InstallerOptions): Promise<void> {
    await this.sudo('RPM', 'dnf', `--assumeyes --nogpgcheck install ${filePath}`);
  }
}

export { InstallerOptions };
