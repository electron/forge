import { ChildProcess } from 'node:child_process';

import { RebuildOptions } from '@electron/rebuild';
import { autoTrace } from '@electron-forge/tracer';
import {
  Listr,
  ListrBaseClassOptions,
  ListrDefaultRenderer,
  ListrDefaultRendererValue,
  ListrSimpleRenderer,
  ListrSimpleRendererValue,
  ListrTask,
  ListrTaskWrapper,
} from 'listr2';

import type {
  Options as ElectronPackagerOptions,
  OfficialArch,
  OfficialPlatform,
} from '@electron/packager';

import type { LoggerOptions } from '@electron-forge/multi-logger';

export type ForgeListrOptions<T> = ListrBaseClassOptions<
  T,
  ListrDefaultRendererValue,
  ListrSimpleRendererValue
>;
export type ForgeListrTask<T> = ListrTaskWrapper<
  T,
  ListrDefaultRenderer,
  ListrDefaultRenderer | ListrSimpleRenderer
>;
export type ForgeListrTaskFn<Ctx = any> = ListrTask<
  Ctx,
  ListrDefaultRenderer
>['task'];
export interface ElectronProcess extends ChildProcess {
  restarted: boolean;
}

export type ForgePlatform = OfficialPlatform;
export type ForgeArch = OfficialArch | 'all';
export type ForgeConfigPublisher = IForgeResolvablePublisher | IForgePublisher;
export type ForgeConfigMaker = IForgeResolvableMaker | IForgeMaker;
export type ForgeConfigPlugin = IForgeResolvablePlugin | IForgePlugin;

/**
 * Arguments of each simple hook, after the Forge configuration that every
 * hook receives first. Simple hooks run for their side effects. A plugin's
 * hook can return a `Listr` for Forge to run as subtasks; anything else it
 * returns is ignored.
 */
export interface ForgeSimpleHookSignatures {
  /**
   * Runs before `start` and `package`. Generate files your app needs at
   * runtime that aren't in its source, such as a licenses file.
   */
  generateAssets: [platform: ForgePlatform, arch: ForgeArch];
  /** Runs before `start` launches your app in development. */
  preStart: [];
  /**
   * Runs after `start` launches your app, and again after every restart.
   * Observe the process (`pid`, the `exit` event) rather than reading its
   * output streams, which Forge already consumes or which are `null`.
   */
  postStart: [appProcess: ElectronProcess];
  /** Runs before `package` calls `@electron/packager`. */
  prePackage: [platform: ForgePlatform, arch: ForgeArch];
  /**
   * Runs in `@electron/packager`'s `afterCopy` hook, once your app is copied
   * to `buildPath`, a temporary folder.
   */
  packageAfterCopy: [
    buildPath: string,
    electronVersion: string,
    platform: ForgePlatform,
    arch: ForgeArch,
  ];
  /**
   * Runs in `@electron/packager`'s `afterPrune` hook, once development
   * dependencies are pruned from `buildPath`. Skipped when
   * `packagerConfig.prune` is `false`.
   */
  packageAfterPrune: [
    buildPath: string,
    electronVersion: string,
    platform: ForgePlatform,
    arch: ForgeArch,
  ];
  /**
   * Runs in `@electron/packager`'s `afterExtract` hook, once the Electron
   * binary is extracted to `buildPath`.
   */
  packageAfterExtract: [
    buildPath: string,
    electronVersion: string,
    platform: ForgePlatform,
    arch: ForgeArch,
  ];
  /** Runs after `package` succeeds, with the paths it wrote. */
  postPackage: [
    packageResult: {
      platform: ForgePlatform;
      arch: ForgeArch;
      outputPaths: string[];
    },
  ];
  /** Runs during `make`, after packaging and before the makers run. */
  preMake: [];
}

/**
 * Arguments of each mutating hook, after the Forge configuration. A
 * mutating hook can return a new value for the argument after the Forge configuration, which
 * replaces it for the rest of the build; returning nothing keeps it.
 */
export interface ForgeMutatingHookSignatures {
  /** Runs after `make` succeeds. Return new results to replace them for the rest of the build. */
  postMake: [makeResults: ForgeMakeResult[]];
  /** Runs once Forge has loaded your configuration. Return a new one to replace it. */
  resolveForgeConfig: [currentConfig: ResolvedForgeConfig];
  /**
   * Runs when Forge reads your app's `package.json` during `start`, `package`
   * and `make`. Return a new object to change what Forge sees. It doesn't
   * change the name or version `@electron/packager` uses for app metadata.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readPackageJson: [packageJson: Record<string, any>];
}

/** The name of any hook, simple or mutating. */
export type ForgeHookName = keyof (ForgeSimpleHookSignatures &
  ForgeMutatingHookSignatures);
/** A simple hook: called with the Forge configuration and the hook's arguments. */
export type ForgeSimpleHookFn<Hook extends keyof ForgeSimpleHookSignatures> = (
  forgeConfig: ResolvedForgeConfig,
  ...args: ForgeSimpleHookSignatures[Hook]
) => Promise<Listr | void>;
/** A mutating hook: may resolve to a replacement for the argument after `forgeConfig`. */
export type ForgeMutatingHookFn<
  Hook extends keyof ForgeMutatingHookSignatures,
> = (
  forgeConfig: ResolvedForgeConfig,
  ...args: ForgeMutatingHookSignatures[Hook]
) => Promise<ForgeMutatingHookSignatures[Hook][0] | void>;
/** The function type of the hook named `Hook`. */
export type ForgeHookFn<Hook extends ForgeHookName> =
  Hook extends keyof ForgeSimpleHookSignatures
    ? ForgeSimpleHookFn<Hook>
    : Hook extends keyof ForgeMutatingHookSignatures
      ? ForgeMutatingHookFn<Hook>
      : never;
/**
 * The `hooks` in your Forge configuration: an optional function for each
 * hook, keyed by its name.
 *
 * @example
 * ```ts title="forge.config.ts"
 * const config: ForgeConfig = {
 *   hooks: {
 *     postPackage: async (forgeConfig, { outputPaths }) => {
 *       console.log('Packaged to', outputPaths);
 *     },
 *   },
 * };
 * ```
 */
export type ForgeHookMap = {
  [S in ForgeHookName]?: ForgeHookFn<S>;
};
/**
 * Hooks as plugins provide them (see {@link IForgePlugin.getHooks}): like
 * {@link ForgeHookMap}, but each hook may be an array of functions.
 */
export type ForgeMultiHookMap = {
  [S in ForgeHookName]?: ForgeHookFn<S> | ForgeHookFn<S>[];
};

export interface IForgePluginInterface {
  triggerHook<Hook extends keyof ForgeSimpleHookSignatures>(
    hookName: Hook,
    hookArgs: ForgeSimpleHookSignatures[Hook],
  ): Promise<void>;
  getHookListrTasks<Hook extends keyof ForgeSimpleHookSignatures>(
    childTrace: typeof autoTrace,
    hookName: Hook,
    hookArgs: ForgeSimpleHookSignatures[Hook],
  ): Promise<ForgeListrTaskDefinition[]>;
  triggerMutatingHook<Hook extends keyof ForgeMutatingHookSignatures>(
    hookName: Hook,
    item: ForgeMutatingHookSignatures[Hook][0],
  ): Promise<ForgeMutatingHookSignatures[Hook][0]>;
  overrideStartLogic(opts: StartOptions): Promise<StartResult>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * @inlineType RebuildMode
 * @inlineType ModuleType
 */
export interface ForgeRebuildOptions extends Omit<
  RebuildOptions,
  'buildPath' | 'electronVersion' | 'arch'
> {}
/**
 * Options for packaging your app, set as `packagerConfig` in your Forge
 * configuration.
 *
 * These are passed through to `@electron/packager`, which documents each
 * of them. Forge sets `dir`, `arch`, `platform`, `out` and `electronVersion`
 * itself, so those can't be configured here.
 *
 * @see [Electron Packager config](https://electronforge.io/config/configuration#electron-packager-config)
 */
export interface ForgePackagerOptions extends Omit<
  ElectronPackagerOptions,
  'dir' | 'arch' | 'platform' | 'out' | 'electronVersion'
> {}
export interface ForgeLoggerOptions extends Pick<
  LoggerOptions,
  'interactive'
> {}
export interface ResolvedForgeConfig {
  /**
   * A string to uniquely identify artifacts of this build, will be appended
   * to the out dir to generate a nested directory.  E.g. out/current-timestamp
   *
   * If a function is provided, it must synchronously return the buildIdentifier
   */
  buildIdentifier?: string | (() => string);
  /**
   * Output directory. Default is './out'.
   */
  outDir?: string;
  /**
   * Functions that run at points in Forge's build lifecycle.
   * See {@link ForgeSimpleHookSignatures} and
   * {@link ForgeMutatingHookSignatures} for each hook's arguments.
   */
  hooks?: ForgeHookMap;
  /**
   * @internal
   */
  pluginInterface: IForgePluginInterface;
  /**
   * An array of Forge plugins or a tuple consisting of [pluginName, pluginOptions]
   */
  plugins: ForgeConfigPlugin[];
  /**
   * Options for rebuilding native Node modules against your Electron version,
   * passed through to `@electron/rebuild`.
   */
  rebuildConfig: ForgeRebuildOptions;
  /**
   * Options for packaging your app, passed through to `@electron/packager`.
   */
  packagerConfig: ForgePackagerOptions;
  /**
   * The makers that turn your packaged app into distributables, such as
   * `@electron-forge/maker-zip`. Each entry is a maker instance or a
   * `{ name, config }` object.
   */
  makers: ForgeConfigMaker[];
  /**
   * The publishers that upload your distributables, such as
   * `@electron-forge/publisher-github`.
   */
  publishers: ForgeConfigPublisher[];
  /**
   * Options for Forge's terminal output.
   */
  logger: ForgeLoggerOptions;
}
/**
 * The type of your Forge configuration, `forge.config.ts` or the
 * `config.forge` field in `package.json`. Every property is optional.
 *
 * | Property | Description |
 * | --- | --- |
 * | {@link ResolvedForgeConfig.packagerConfig packagerConfig} | Options for `@electron/packager` |
 * | {@link ResolvedForgeConfig.rebuildConfig rebuildConfig} | Options for `@electron/rebuild` |
 * | {@link ResolvedForgeConfig.makers makers} | Makers that build distributables |
 * | {@link ResolvedForgeConfig.publishers publishers} | Publishers that upload them |
 * | {@link ResolvedForgeConfig.plugins plugins} | Plugins such as Vite or webpack |
 * | {@link ResolvedForgeConfig.hooks hooks} | Lifecycle hooks |
 * | {@link ResolvedForgeConfig.buildIdentifier buildIdentifier} | Suffix for the output directory |
 * | {@link ResolvedForgeConfig.outDir outDir} | Output directory, `./out` by default |
 * | {@link ResolvedForgeConfig.logger logger} | Terminal output options |
 *
 * @example
 * ```ts title="forge.config.ts"
 * import type { ForgeConfig } from '@electron-forge/shared-types';
 * import { MakerZIP } from '@electron-forge/maker-zip';
 *
 * const config: ForgeConfig = {
 *   packagerConfig: { asar: true },
 *   makers: [new MakerZIP({}, ['darwin'])],
 * };
 *
 * export default config;
 * ```
 *
 * @see [Configuration guide](https://electronforge.io/config/configuration)
 */
export type ForgeConfig = Partial<Omit<ResolvedForgeConfig, 'pluginInterface'>>;

/**
 * Return result for the Package command
 */
export interface ForgePackageResult {
  /**
   * The platform for this packaged app
   */
  platform: ForgePlatform;
  /**
   * The arch for this packaged app
   */
  arch: ForgeArch;
  /**
   * The path to the packaged app
   */
  packagedPath: string;
}

export interface ForgeMakeResult {
  /**
   * An array of paths to artifacts generated for this make run
   */
  artifacts: string[];
  /**
   * The state of the package.json file when the make happened
   */
  packageJSON: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  /**
   * The platform this make run was for
   */
  platform: ForgePlatform;
  /**
   * The arch this make run was for
   */
  arch: ForgeArch;
  /**
   * The name of the maker that generated these artifacts
   */
  maker?: string;
}

export interface IForgeResolvablePlugin {
  name: string;
  config?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface IForgePlugin {
  /** @internal */
  __isElectronForgePlugin: boolean;
  name: string;

  init(dir: string, forgeConfig: ResolvedForgeConfig): void;
  getHooks?(): ForgeMultiHookMap;
  startLogic?(opts: StartOptions): Promise<StartResult>;
}

export interface IForgeResolvableMaker {
  name: string;
  config: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  enabled?: boolean;
  platforms?: ForgePlatform[] | null;
}

export interface IForgeMaker {
  /** @internal */
  __isElectronForgeMaker: boolean;
  readonly platforms?: ForgePlatform[];
}

export interface IForgeResolvablePublisher {
  name: string;
  platforms?: ForgePlatform[] | null;
  config?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface IForgePublisher {
  /** @internal */
  __isElectronForgePublisher: boolean;
  readonly platforms?: ForgePlatform[];
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
  /**
   * Enables the node inspector, you can connect to this from chrome://inspect
   * Pauses the execution on first JavaScript line until debugger connects.
   */
  inspectBrk?: boolean;
}

export type InnerStartResult = ElectronProcess | string | string[] | false;
export type StartResult =
  | InnerStartResult
  | { tasks: ForgeListrTaskDefinition[]; result: InnerStartResult };

export interface InitTemplateOptions {
  copyCIFiles?: boolean;
  force?: boolean;
  typescript?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ForgeListrTaskDefinition = ListrTask<never>;
export { ListrTask };

export interface ForgeTemplate {
  requiredForgeVersion?: string;
  dependencies?: string[];
  devDependencies?: string[];
  /**
   * Computes dev dependencies for the given init options. Takes precedence
   * over `devDependencies` when defined.
   */
  getDevDependencies?: (options: InitTemplateOptions) => string[];
  initializeTemplate?: (
    dir: string,
    options: InitTemplateOptions,
  ) => Promise<void | ForgeListrTaskDefinition[]>;
}

export type PackagePerson =
  | undefined
  | string
  | {
      name: string;
      email?: string;
      url?: string;
    };

export type PossibleModule<T> = {
  default?: T;
} & T;
