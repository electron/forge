export default class Installer {
  constructor(name) {
    this.name = name;
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
  async install({
    filePath, // eslint-disable-line
    installSpinner // eslint-disable-line
  }) {
    throw new Error(`Installer ${this.name} did not implement the install method`);
  }
}
