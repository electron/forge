export interface MakerDebConfigOptions {
  /**
   * Name of the package (e.g. atom), used in the Package field of the control
   * specification.
   *
   * Package names [...] must consist only of lower case letters (a-z), digits
   * (0-9), plus (+) and minus (-) signs, and periods (.). They must be at
   * least two characters long and must start with an alphanumeric character.
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
   * Short description of the application, used in the Description field of the control
   * specification.
   */
  description?: string;
  /**
   * Long description of the application, used in the Description field of the control
   * specification.
   */
  productDescription?: string;
  /**
   * Version number of the package, used in the Version field of the control specification.
   */
  version?: string;
  /**
   * Revision number of the package, used in the Version field of the control specification.
   */
  revision?: string;
  /**
   * Application area into which the package has been classified.
   *
   * Possible sections.  Generated on https://packages.debian.org/unstable/ with:
   *
   * ```javascript
   * $$('#content dt a').map(n => {
   *   const ss = n.href.split('/');
   *   return `'${ss[ss.length - 2]}'`;
   * }).sort().join(' | ')
   * ```
   */
  section?:
    | 'admin'
    | 'cli-mono'
    | 'comm'
    | 'database'
    | 'debian-installer'
    | 'debug'
    | 'devel'
    | 'doc'
    | 'editors'
    | 'education'
    | 'electronics'
    | 'embedded'
    | 'fonts'
    | 'games'
    | 'gnome'
    | 'gnu-r'
    | 'gnustep'
    | 'graphics'
    | 'hamradio'
    | 'haskell'
    | 'httpd'
    | 'interpreters'
    | 'introspection'
    | 'java'
    | 'javascript'
    | 'kde'
    | 'kernel'
    | 'libdevel'
    | 'libs'
    | 'lisp'
    | 'localization'
    | 'mail'
    | 'math'
    | 'metapackages'
    | 'misc'
    | 'net'
    | 'news'
    | 'ocaml'
    | 'oldlibs'
    | 'otherosfs'
    | 'perl'
    | 'php'
    | 'python'
    | 'ruby'
    | 'rust'
    | 'science'
    | 'shells'
    | 'sound'
    | 'tasks'
    | 'tex'
    | 'text'
    | 'utils'
    | 'vcs'
    | 'video'
    | 'virtual'
    | 'web'
    | 'x11'
    | 'xfce'
    | 'zope';
  /**
   * How important is it to have the package installed.
   *
   * You can read more: https://www.debian.org/doc/debian-policy/#priorities
   */
  priority?: 'required' | 'important' | 'standard' | 'optional';
  /**
   * Estimate of the total amount of disk space required to install the named package,
   * used in the Installed-Size field of the control specification.
   */
  size?: number;
  /**
   * Relationships to other packages, used in the Depends field of the control specification.
   */
  depends?: string[];
  /**
   * Relationships to other packages, used in the Recommends field of the control specification.
   */
  recommends?: string[];
  /**
   * Relationships to other packages, used in the Suggests field of the control specification.
   */
  suggests?: string[];
  /**
   * Relationships to other packages, used in the Enhances field of the control specification.
   */
  enhances?: string[];
  /**
   * Relationships to other packages, used in the Pre-Depends field of the control specification.
   */
  preDepends?: string[];
  /**
   * Maintainer of the package, used in the Maintainer field of the control specification.
   */
  maintainer?: string;
  /**
   * URL of the homepage for the package, used in the Homepage field of the control specification.
   */
  homepage?: string;
  /**
   * Relative path to the executable that will act as binary for the application, used in the Exec
   * field of the desktop specification.
   *
   * Defaults to options.name
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
  /**
   * You can use these to quieten lintian.
   */
  lintianOverrides?: string[];
  /**
   * Path to package maintainer scripts with their corresponding name, used in the installation
   * procedure.
   *
   * Read More:
   * https://www.debian.org/doc/debian-policy/#package-maintainer-scripts-and-installation-procedure
   */
  scripts?: {
    preinst?: string;
    postinst?: string;
    prerm?: string;
    postrm?: string;
  };
  /**
   * The absolute path to a custom template for the generated FreeDesktop.org desktop entry file.
   */
  desktopTemplate?: string;
}

export interface MakerDebConfig {
  options?: MakerDebConfigOptions;
}
