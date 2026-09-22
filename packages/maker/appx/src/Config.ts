/**
 * Configuration for the legacy AppX maker.
 *
 * @deprecated Use `@electron-forge/maker-msix` and its `MakerMSIXConfig`
 * instead. These options are mapped onto `electron-windows-msix`; options
 * marked as deprecated below have no MSIX equivalent and are ignored.
 */
export interface MakerAppXConfig {
  /**
   * @deprecated Ignored. The Desktop App Converter code path was removed
   * together with `electron-windows-store`.
   */
  containerVirtualization?: boolean;
  /**
   * @deprecated Ignored. It was never read by `electron-windows-store` either.
   */
  flatten?: boolean;
  /**
   * The version of the package in the `X.Y.Z.A` format.
   *
   * @defaultValue `${packageJSON.version}.0`
   */
  packageVersion?: string;
  /**
   * The identity name of the package, also used as the base name of the
   * generated `.msix` file.
   *
   * @defaultValue `packageJSON.name` with dashes removed
   */
  packageName?: string;
  /**
   * @defaultValue The app name
   */
  packageDisplayName?: string;
  /**
   * @defaultValue `packageJSON.description`, falling back to the app name
   */
  packageDescription?: string;
  /**
   * The background color of the package's visual elements.
   */
  packageBackgroundColor?: string;
  /**
   * The executable to launch, relative to the packaged app directory. A
   * leading `app\\` segment is accepted for backwards compatibility.
   *
   * @defaultValue `<appName>.exe`
   */
  packageExecutable?: string;
  /**
   * Path to a folder of visual assets (icons and tile images) for the
   * package manifest. Unless a custom {@link MakerAppXConfig.manifest} is
   * set, the folder must contain the files the generated manifest refers to:
   * `icon.png`, `Square44x44Logo.png` and `Square150x150Logo.png`. These
   * differ from the `SampleAppx.*.png` names used by `electron-windows-store`.
   */
  assets?: string;
  /**
   * Path to a custom `AppxManifest.xml`. When set, the manifest-related
   * options above are ignored.
   */
  manifest?: string;
  /**
   * @deprecated Ignored. Install the generated `.msix` yourself.
   */
  deploy?: boolean;
  /**
   * The publisher of the package as an X.500 distinguished name, e.g.
   * `CN=developmentca`. It must match the subject of the signing certificate.
   *
   * @defaultValue `CN=<author.name from package.json>`
   */
  publisher?: string;
  /**
   * Path to the Windows Kit `bin` folder containing `makeappx.exe`,
   * `makepri.exe` and `signtool.exe`. When unset, the maker searches the
   * default Windows Kits install locations (preferring the newest SDK) and
   * otherwise leaves the lookup to `electron-windows-msix`.
   */
  windowsKit?: string;
  /**
   * Path to a `.pfx` certificate to sign the package with. When unset,
   * `electron-windows-msix` signs the package with a self-signed development
   * certificate, which is saved next to the `.msix` as `dev_cert.cer` and
   * `dev_cert.pfx` so it can be trusted on a test device. The `.pfx` password
   * is `WINDOWS_CERTIFICATE_PASSWORD` when that environment variable is set,
   * otherwise a random one.
   *
   * Signing timestamps against `http://timestamp.digicert.com` unless the
   * `WINDOWS_TIMESTAMP_SERVER` environment variable names another server.
   */
  devCert?: string;
  /**
   * Password for {@link MakerAppXConfig.devCert}. Required by
   * `@electron/windows-sign` unless {@link MakerAppXConfig.signtoolParams}
   * is set, so a password-less certificate needs `signtoolParams`. Ignored
   * when `devCert` is unset.
   */
  certPass?: string;
  /**
   * @deprecated Ignored. The Desktop App Converter code path was removed
   * together with `electron-windows-store`.
   */
  desktopConverter?: string;
  /**
   * @deprecated Ignored. The Desktop App Converter code path was removed
   * together with `electron-windows-store`.
   */
  expandedBaseImage?: string;
  /**
   * @deprecated Ignored. `electron-windows-msix` does not accept extra
   * `makeappx.exe` parameters.
   */
  makeappxParams?: string[];
  /**
   * Extra parameters for `signtool.exe`, passed through as `signWithParams`
   * of `@electron/windows-sign`. Only used when {@link MakerAppXConfig.devCert}
   * is set.
   */
  signtoolParams?: string[];
  /**
   * Whether to generate `resources.pri` with `makepri.exe`.
   *
   * @defaultValue false
   */
  makePri?: boolean;
  /**
   * @deprecated Ignored. `electron-windows-msix` does not accept extra
   * `makepri.exe` parameters.
   */
  createConfigParams?: string[];
  /**
   * @deprecated Ignored. `electron-windows-msix` does not accept extra
   * `makepri.exe` parameters.
   */
  createPriParams?: string[];
  /**
   * @deprecated Ignored. There is no pre-packaging hook in
   * `electron-windows-msix`.
   */
  finalSay?: () => Promise<void>;

  /**
   * Strip semver prerelease and build metadata from the version instead of
   * failing, so that it fits the `X.Y.Z.A` format the Windows Store requires.
   */
  makeVersionWinStoreCompatible?: boolean;
}
