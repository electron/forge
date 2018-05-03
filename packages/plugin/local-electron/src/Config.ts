export interface LocalElectronPluginConfig {
  /**
   * Whether or not the plugin is enabled.
   *
   * Can be handy to set this to an environment variable for quick personal
   * toggling of this plugin.
   *
   * Default: `true`
   */
  enabled?: boolean;
  /**
   * An absolute path to the folder containing your built version of Electron.
   *
   * Normally this looks like `/path/to/electron/out/D`
   */
  electronPath: string;
  /**
   * The platform your local build of Electron is for.  You only need to set
   * this if you have a local build for a platform that isn't your system's
   * platform.
   *
   * Default: process.platform
   */
  electronPlatform?: string;
  /**
   * The arch your local build of Electron is for.  You only need to set this if
   * you have a local build for an arch that isn't your system's arch.
   *
   * Default: process.arch
   */
  electronArch?: string;
}
