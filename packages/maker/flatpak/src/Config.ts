export interface MakerFlatpakOptionsConfig {
  /**
   * App id of the flatpak, used in the id field of a flatpak-builder manifest.
   *
   * Default: io.atom.electron
   */
  id?: string;
  /**
   * Name of the application (e.g. Atom), used in the Name field of the desktop specification.
   */
  productName?: string;
  /**
   * Generic name of the application (e.g. Text Editor), used in the GenericName field of the
   * desktop specification.
   */
  genericName?: string;
  /**
   * Short description of the application, used in the Comment field of the desktop specification.
   */
  description?: string;
  /**
   * Release branch of the flatpak, used in the branch field of a flatpak-builder manifest.
   *
   * Default: master
   */
  branch?: string;
  /**
   * Base app to use when building the flatpak, used in the base field of a
   * flatpak-builder manifest.
   *
   * Default: io.atom.electron.BaseApp
   */
  base?: string;
  /**
   * Base app version, used in the base-version field of a flatpak-builder manifest.
   *
   * Default: master
   */
  baseVersion?: string;
  /**
   * Url of a flatpakref to use to auto install the base application.
   */
  baseFlatpakref?: string;
  /**
   * Runtime id, used in the runtime field of a flatpak-builder manifest.
   *
   * Default: org.freedesktop.Platform
   */
  runtime?: string;
  /**
   * Runtime version, used in the runtime-version field of a flatpak-builder manifest.
   *
   * Default: 1.4
   */
  runtimeVersion?: string;
  /**
   * Sdk id, used in the sdk field of a flatpak-builder manifest.
   *
   * Default: org.freedesktop.Sdk
   */
  sdk?: string;
  /**
   * Arguments to use when call flatpak build-finish, use in the finish-args field of a
   * flatpak-builder manifest.
   */
  finishArgs?: string[];
  /**
   * Files to copy directly into the app. Should be a list of [source, dest] tuples.
   * Source should be a relative/absolute path to a file/directory to copy
   * into the flatpak, and dest should be the path inside the app install
   * prefix (e.g. /share/applications/)
   *
   * Application assets and code will be fully handled by electron-packager,
   * but this is a useful way to install things such as appstream metadata
   * for an app, or dbus configuration files.
   */
  files: [string, string][];
  /**
   * This option can be used to build extra software modules into the flatpak
   * application sandbox. Most electron applications will not need this, but
   * if you are using native node modules that require certain libraries on
   * the system, this may be necessary.
   */
  modules?: (Record<string, unknown> | string)[];
  /**
   * Relative path to the executable that will act as binary for the application, used in the
   * Exec field of the desktop specification.
   */
  bin?: string;
  /**
   * Path to a single image that will act as icon for the application:
   */
  icon?: string;
  /**
   * Categories in which the application should be shown in a menu, used in the Categories field
   * of the desktop specification.
   *
   * Generated on https://specifications.freedesktop.org/menu-spec/latest/apa.html with:
   *
   * `(${$$('.informaltable tr td:first-child').map(td => `'$\{td.innerText\}'`).join(' | ')})[]`
   */
  categories?: (
    | 'AudioVideo'
    | 'Audio'
    | 'Video'
    | 'Development'
    | 'Education'
    | 'Game'
    | 'Graphics'
    | 'Network'
    | 'Office'
    | 'Science'
    | 'Settings'
    | 'System'
    | 'Utility'
  )[];
  /**
   * MIME types the application is able to open, used in the MimeType field of the desktop
   * specification.
   */
  mimeType?: string[];
}

export interface MakerFlatpakConfig {
  options?: MakerFlatpakOptionsConfig;
}
