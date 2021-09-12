import { OraImpl } from '@electron-forge/async-ora';

export interface InstallerOptions {
  filePath: string;
  installSpinner: OraImpl;
}

export default abstract class Installer {
  abstract name: string;

  __isElectronForgeInstaller!: boolean;

  constructor() {
    Object.defineProperty(this, '__isElectronForgeInstaller', {
      value: true,
      enumerable: false,
      configurable: false,
    });
  }

  /**
   * Installers must implement this method and install the given filePath
   * when called.  This method must return a promise
   */
  async install(_opts: InstallerOptions): Promise<void> {
    throw new Error(`Installer ${this.name} did not implement the install method`);
  }
}
