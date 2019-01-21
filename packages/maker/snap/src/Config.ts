// eslint-disable-next-line import/prefer-default-export
export interface MakerSnapConfig {
  /**
   * [Additional Snapcraft configuration](https://docs.snapcraft.io/build-snaps/syntax#app-name) for the Electron app.
   */
  appConfig?: string;
  /**
   * Additional [plugs](https://docs.snapcraft.io/reference/interfaces) for the
   * Electron app which are necessary for the app to
   * be a consumer of a feature in the system. Common features can be set via
   * the `features` option. To set any attributes for the plugs, set them in the
   * plugs option.
   */
  appPlugs?: string[];
  /**
   * Additional [slots](https://docs.snapcraft.io/reference/interfaces) for the
   * Electron app which are necessary for the app to
   * be a producer of a feature in the system. Common features can be set via
   * the `features` option. To set any attributes for the plugs, set them in
   * the slots option.
   */
  appSlots?: string[];
  /**
   * See the [Snapcraft documentation](https://snapcraft.io/docs/reference/confinement).
   *
   * Default: devmode
   */
  confinement?: 'strict' | 'devmode' | 'classic';
  /**
   * The longer description for the snap. Can contain newlines.
   */
  description?: string;
  /**
   * The absolute path to a custom Freedesktop.org desktop file template.
   */
  desktopTemplate?: string;
  /**
   * The executable name of the Electron app, sans file extension. Corresponds
   * to the [`executableName` option](https://github.com/electron-userland/electron-packager/blob/master/docs/api#executablename)
   * in Electron Packager.
   */
  executableName?: string;
  /**
   * Describes what functionality the Electron app needs, in order to work inside the Snap sandbox.
   */
  features?: {
    /**
     * PulseAudio support
     */
    audio?: true;
    /**
     * ALSA support (replaces audio support if both are specified)
     */
    alsa?: true;
    /**
     * [web browser functionality](https://github.com/snapcore/snapd/wiki/Interfaces#browser-support) (e.g., Brave)
     */
    browserSandbox?: true;
    /**
     * [MPRIS](https://specifications.freedesktop.org/mpris-spec/latest/) support.
     *
     * If enabled, the interface name must be specified as the feature value.
     */
    mpris?: string;
    /**
     * Access the secret service (e.g., GNOME Keyring)
     */
    passwords?: true;
    /**
     * WebGL support (requires Mesa, etc.)
     */
    webgl?: true;
  };
  /**
   * The quality grade of the Snap. See the [Snapcraft documentation](https://docs.snapcraft.io/build-snaps/syntax#grade) for valid values.
   */
  grade?: 'devel' | 'stable';
  /**
   * The name of the Snap package
   */
  name?: string;
  /**
   * The absolute path to the snapcraft executable
   */
  snapcraft?: string;
  /**
   * A 78 character long summary for the Snap
   */
  summary?: string;
  /**
   * The version of the Snap package
   */
  version?: string;
}
