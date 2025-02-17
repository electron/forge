import { Features, MSICreator } from 'electron-wix-msi/lib/creator';

import type { MSICreatorOptions } from 'electron-wix-msi/lib/creator';

export interface MakerWixConfig {
  /**
   * String to set as appUserModelId on the shortcut. If none is passed, it'll
   * be set to com.squirrel.(Name).(exe), which should match the id given to
   * your app by Squirrel.
   */
  appUserModelId?: string;
  /**
   * Custom System.AppUserModel.ToastActivatorCLSID shortcut property value
   */
  toastActivatorClsid?: string;
  /**
   * The app's description
   */
  description?: string;
  /**
   * The name of the exe file
   */
  exe?: string;
  /**
   * The app's icon
   */
  icon?: string;
  /**
   * Specify WiX extensions to use e.g `['WixUtilExtension', 'C:\My WiX Extensions\FooExtension.dll']`
   */
  extensions?: Array<string>;
  /**
   * Specify command line options to pass to light.exe e.g. `['-sval', '-ai']`.
   * Used to activate PropertyGroup options as specified in the [Light Task](https://docs.firegiant.com/wix3/msbuild/task_reference/light/ documentation.
   */
  lightSwitches?: Array<string>;
  /**
   * Specify a specific culture for light.exe to build using the culture switch e.g `en-us`.
   */
  cultures?: string;
  /**
   * The [Microsoft Windows Language Code identifier](https://msdn.microsoft.com/en-us/library/cc233965.aspx) used by the installer.
   * Will use 1033 (English, United-States) if left undefined.
   */
  language?: number;
  /**
   * The app's manufacturer
   */
  manufacturer?: string;
  /**
   * The app's name
   */
  name?: string;
  /**
   * Name of the folder your app will live in. Will use the app's `name` if left
   * undefined.
   */
  programFilesFolderName?: string;
  /**
   * Name of an additional subfolder in `programFilesFolderName` where the app will live,
   * e.g. "Company" to install to "C:\Program Files\Company\App" instead of "C:\Program Files\App".
   */
  nestedFolderName?: string;
  /**
   * A short name for the app, used wherever spaces and special characters are
   * not allowed. Will use the `name` if left undefined.
   */
  shortName?: string;
  /**
   * Name of the shortcut folder in the Windows Start Menu. Will use the
   * `manufacturer` field if left undefined.
   */
  shortcutFolderName?: string;
  /**
   * Enables configuration of the UI
   */
  ui?: UIOptions | false;
  /**
   * A unique UUID used by your app to identify itself. This module will
   * generate one for you, but it is important to reuse it to enable
   * conflict-free upgrades.
   */
  upgradeCode?: string;
  /**
   * The app's version
   */
  version?: string;
  /**
   * Defines the architecture the MSI is build for. Values can be either `x86` or `x64`.
   * Default's to `x86` if left undefined.
   */
  arch?: 'x64' | 'ia64' | 'x86';
  /**
   * Automatically run the app after the installation is complete
   */
  autoRun?: boolean;
  /**
   * Install mode. Defaults to `perMachine`.
   */
  defaultInstallMode?: 'perUser' | 'perMachine';
  /**
   * Overrides the default reboot behavior if files are in use during the upgrade.
   * By default, this will be set to "ReallySuppress" to make sure no unexpected reboot will happpen.
   */
  rebootMode?: string;
  /**
   * Installlation level to use that determines which features are installed.
   * see guides/enduser.md to check which Install Level maps to which feature that will
   * correspondingly get installed.
   * If not set, this will default to "2" (Main Feature, Launch On Login)
   */
  installLevel?: number;
  /**
   * A comma separated string of extensions with each to be associated the app icon.
   */
  associateExtensions?: string;
  /**
   * Set to true if the MSI will be bundled via Burn with other MSI
   * to not make an individual UninstallDisplayName registry entry for it
   */
  bundled?: boolean;
  /**
   * Configuration options to sign the resulting `.msi` file.
   * Accepts all [@electron/windows-sign](https://github.com/electron/windows-sign/) options.
   */
  windowsSign?: MSICreatorOptions['windowsSign'];
  /**
   * Parameters to pass to signtool.exe. Overrides `certificateFile` and
   * `certificatePassword`.
   * Deprecated, use `windowsSign` instead
   * @deprecated
   */
  signWithParams?: string;
  /**
   * The path to an Authenticode Code Signing Certificate.
   * Deprecated, use `windowsSign` instead
   * @deprecated
   */
  certificateFile?: string;
  /**
   * The password to decrypt the certificate given in `certificateFile`.
   * Deprecated, use `windowsSign` instead
   * @deprecated
   */
  certificatePassword?: string;
  /**
   * Enables configuration of the autoUpdate and autoLaunch features.
   * By default, they are disabled.
   */
  features?: Features | false;
  /**
   * Allows for the modification of the MSICreator before create is called.
   */
  beforeCreate?: (creator: MSICreator) => Promise<void> | void;
}
export interface UIOptions {
  /**
   * If set to true, the end user will be able to choose the installation
   * directory. Set to false by default. Without effect if a custom template is
   * used.
   */
  chooseDirectory?: boolean;
  /**
   * Substitute your own XML that will be inserted into the final .wxs file
   * before compiling the installer to customize the UI options.
   */
  template?: string;
  /**
   * Overwrites default installer images with custom files. I recommend JPG.
   */
  images?: UIImages;
  /**
   * Provide an array of paths to `.wxl` files containing the localizations
   */
  localizations?: Array<string>;
}
export interface UIImages {
  /**
   * 493 x 312 Background bitmap used on the welcome and completion dialogs.
   * Will be used as WixUIDialogBmp
   */
  background?: string;
  /**
   * 493 × 58 Top banner used on most dialogs that don't use background.
   * Will be used as WixUIBannerBmp
   */
  banner?: string;
  /**
   * 32 x 32 Exclamation icon on the WaitForCostingDlg dialog.
   * Will be used as WixUIExclamationIco
   */
  exclamationIcon?: string;
  /**
   * 32 x 32 Information icon on the cancel and error dialogs.
   * Will be used as WixUIInfoIco
   */
  infoIcon?: string;
  /**
   * 16 x 16 "New folder" icon for the "browse" dialog. Will be used as WixUINewIco
   */
  newIcon?: string;
  /**
   * 16 x 16 "Up" icon for the "browse" dialog. Will be used as WixUIUpIco
   */
  upIcon?: string;
}
