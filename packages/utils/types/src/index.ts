import { ChildProcess } from 'child_process';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Options } from 'electron-packager';
import { RebuildOptions } from 'electron-rebuild/lib/src/rebuild';

export type ForgePlatform = 'darwin' | 'mas' | 'win32' | 'linux';
export type ForgeArch = 'ia32' | 'x64' | 'armv7l' | 'arm' | 'all';
export type ForgeHookFn = (forgeConfig: ForgeConfig, ...args: any[]) => Promise<any>;
export interface IForgePluginInterface {
  triggerHook(hookName: string, hookArgs: any[]): Promise<void>;
  triggerMutatingHook<T>(hookName: string, item: T): Promise<any>;
  overrideStartLogic(opts: any): Promise<ChildProcess | string | string[] | false>;
}
export interface ForgeConfig {
  /**
   * A string to uniquely identify artifacts of this build, will be appended
   * to the out dir to generate a nested directory.  E.g. out/current-timestamp
   *
   * If a function is provided it must syncronously return the buildIdentifier
   */
  buildIdentifier?: string | (() => string);
  hooks?: {
    [hookName: string]: ForgeHookFn;
  };
  /**
   * @generated
   */
  pluginInterface: IForgePluginInterface;
  /**
   * An array of forge plugins or a tuple consisting of [pluginName, pluginOptions]
   */
  plugins: (IForgePlugin | [string, any])[];
  electronRebuildConfig: Partial<RebuildOptions>;
  packagerConfig: Partial<Options>;
  makers: (IForgeResolvableMaker | IForgeMaker)[];
  publishers: (IForgeResolvablePublisher | IForgePublisher | string)[];
}
export interface ForgeMakeResult {
  /**
   * An array of paths to artifacts generated for this make run
   */
  artifacts: string[];
  /**
   * The state of the package.json file when the make happened
   */
  packageJSON: any;
  /**
   * The platform this make run was for
   */
  platform: ForgePlatform;
  /**
   * The arch this make run was for
   */
  arch: ForgeArch;
}

export interface IForgePlugin {
  __isElectronForgePlugin: boolean;
  name: string;

  init(dir: string, forgeConfig: ForgeConfig): void;
  getHook?(hookName: string): ForgeHookFn | null;
  startLogic?(opts: StartOptions): Promise<ChildProcess | false>;
}

export interface IForgeResolvableMaker {
  name: string;
  platforms: ForgePlatform[] | null;
  config: any;
}

export interface IForgeMaker {
  __isElectronForgeMaker: boolean;
  platforms?: undefined;
}

export interface IForgeResolvablePublisher {
  name: string;
  platforms?: ForgePlatform[] | null;
  config?: any;
}

export interface IForgePublisher {
  __isElectronForgePublisher: boolean;
  platforms?: undefined;
}

export interface StartOptions {
  /**
   * The path to the electron forge project to run
   */
  dir?: string;
  /**
   * The path (relative to dir) to the electron app to run relative to the project directory
   */
  appPath?: string;
  /**
   * Whether to use sensible defaults or prompt the user visually
   */
  interactive?: boolean;
  /**
   * Enables advanced internal Electron debug calls
   */
  enableLogging?: boolean;
  /**
   * Arguments to pass through to the launched Electron application
   */
  args?: (string | number)[];
  /**
   * Runs the Electron process as if it were node, disables all Electron API's
   */
  runAsNode?: boolean;
  /**
   * Enables the node inspector, you can connect to this from chrome://inspect
   */
  inspect?: boolean;
}

export interface ForgeTemplate {
  dependencies?: string[];
  devDependencies?: string[];
  templateDirectory?: string;
  postCopy?: (dir: string) => void;
}
