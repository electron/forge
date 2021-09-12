export interface MakerRpmConfigOptions {
  /**
   * Name of the package (e.g. atom), used in the Package field of the control
   * specification.
   */
  name?: string;
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
   * Short description of the application, used in the Summary field of the spec file.
   */
  description?: string;
  /**
   * Long description of the application, used in the %description tag of the spec file.
   */
  productDescription?: string;
  /**
   * Version number of the package, used in the Version field of the spec file.
   */
  version?: string;
  /**
   * Revision number of the package, used in the Release field of the spec file.
   */
  revision?: string;
  /**
   * License of the package, used in the License field of the spec file.
   */
  license?: string;
  /**
   * Group of the package, used in the Group field of the spec file.
   */
  group?: string;
  /**
   * Packages that are required when the program starts, used in the Requires field of the
   * spec file.
   */
  requires?: string[];
  /**
   * URL of the homepage for the package, used in the Homepage field of the control specification.
   */
  homepage?: string;
  /**
   * Package compression level, from 0 to 9.
   */
  compressionLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /**
   * Relative path to the executable that will act as binary for the application, used in the
   * Exec field of the desktop specification.
   *
   * Defaults to options.name
   */
  bin?: string;
  /**
   * Command-line arguments to pass to the executable. Will be added to the Exec field of the
   * desktop specification.
   */
  execArguments?: string[];
  /**
   * Path to a single image that will act as icon for the application:
   */
  icon?: string;
  /**
   * Categories in which the application should be shown in a menu, used in the Categories field of
   * the desktop specification.
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

export interface MakerRpmConfig {
  options?: MakerRpmConfigOptions;
}
