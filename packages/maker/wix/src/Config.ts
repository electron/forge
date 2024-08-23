import { Features, MSICreator } from 'electron-wix-msi/lib/creator';

export interface MakerWixConfig {
  /**
   * String to set as appUserModelId on the shortcut. If none is passed, it'll
   * be set to com.squirrel.(Name).(exe), which should match the id given to
   * your app by Squirrel.
   */
  appUserModelId?: string;
  /**
   * A comma separated string of extensions with each to be associated the app icon.
   */
  associateExtensions?: string;
  /**
   * The app's description
   */
  description?: string;
  /**
   * The name of the exe file
   */
  exe?: string;
  /*
   * The app's icon
   */
  icon?: string;
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
   * Parameters to pass to signtool.exe. Overrides `certificateFile` and
   * `certificatePassword`.
   */
  signWithParams?: string;
  /**
   * The path to an Authenticode Code Signing Certificate.
   */
  certificateFile?: string;
  /**
   * The password to decrypt the certificate given in `certificateFile`.
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
