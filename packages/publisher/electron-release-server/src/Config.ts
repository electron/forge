type DarwinFileExtension = '.dmg' | '.pkg' | '.mas' | '.zip';

type WindowsFileExtension = '.exe' | '.msi' | '.nupkg';

type LinuxFileExtension = '.deb' | '.gz' | '.rpm' | '.AppImage';

export interface PublisherERSConfig {
  /**
   * The base URL of your instance of ERS.
   *
   * E.g. https://my-update.server.com
   */
  baseUrl: string;
  /**
   * The username you use to sign in to ERS
   */
  username: string;
  /**
   * The password you use to sign in to ERS
   */
  password: string;
  /**
   * The release channel you want to send artifacts to, normally something like
   * "stable", "beta" or "alpha".
   *
   * If left unspecified we will try to infer the channel from your version
   * field in your package.json.
   *
   * Default: stable
   */
  channel?: string;
  /**
   * The "flavor" of the binary that you want to release to.
   * This is useful if you want to provide multiple versions
   * of the same application version (e.g. full and lite)
   * to end users.
   */
  flavor?: string;
  fileExtensions?: {
    darwin?: DarwinFileExtension[];
    win32?: WindowsFileExtension[];
    linux?: LinuxFileExtension[];
  };
}
