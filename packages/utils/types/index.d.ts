import { ChildProcess } from "child_process";
import { Options } from "electron-packager";
import { RebuildOptions } from "electron-rebuild/lib/src/rebuild";

declare module '@electron-forge/shared-types' {
  export type ForgePlatform = 'darwin' | 'mas' | 'win32' | 'linux';
  export type ForgeArch = 'ia32' | 'x64' | 'armv7l' | 'arm'; 
  export type ForgeHookFn = (forgeConfig: ForgeConfig, ...args: any[]) => Promise<void>;
  export interface IForgePluginInterface {
    triggerHook(hookName: string, hookArgs: any[]): Promise<void>;
    overrideStartLogic(opts: any): Promise<ChildProcess | false>;
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
    electronRebuildConfig: RebuildOptions;
    packagerConfig: Options;
    makers: (IForgeResolvableMaker | IForgeMaker)[];
    publishers: (IForgeResolvablePublisher | IForgePublisher | string)[];
  }
  export interface ForgeMakeResult {
    /**
     * An array of paths to artifacts generated for this make run
     */
    artifacts: Array<string>;
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
    // FIXME: MarshallOfSound - Having any here is depressing
    startLogic?(opts: any): Promise<ChildProcess | false>;
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
}
