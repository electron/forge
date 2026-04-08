import {
  ForgeHookFn,
  ForgeHookName,
  ForgeListrTask,
  ForgeMultiHookMap,
  IForgePlugin,
  ResolvedForgeConfig,
  StartOptions,
  StartResult,
} from '@electron-forge/shared-types';

export { StartOptions };

export default abstract class Plugin<C> implements IForgePlugin {
  public abstract name: string;

  /** @internal */
  __isElectronForgePlugin!: true;
  /** @internal */
  _resolvedHooks: ForgeMultiHookMap = {};

  constructor(public config: C) {
    Object.defineProperty(this, '__isElectronForgePlugin', {
      value: true,
      enumerable: false,
      configurable: false,
    });
  }

  init(_dir: string, _config: ResolvedForgeConfig): void {
    // This logic ensures that we only call getHooks once regardless of how many
    // times we trip hook logic in the PluginInterface.
    this._resolvedHooks = this.getHooks();
    this.getHooks = () => this._resolvedHooks;
  }

  getHooks(): ForgeMultiHookMap {
    return {};
  }

  async startLogic(_startOpts: StartOptions): Promise<StartResult> {
    return false;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Wraps a hook function to receive the Listr2 task object as the first argument,
 * enabling `task.output` and `task.title` updates from within the hook. Also sets
 * a custom display name for the task in the Listr2 renderer.
 *
 * @example
 * ```ts
 * import { createHookWithTask } from '@electron-forge/plugin-base';
 *
 * export default {
 *   hooks: {
 *     prePackage: createHookWithTask(async (task, config, platform, arch) => {
 *       task.title = 'Preparing native modules';
 *       task.output = 'Compiling...';
 *     }, 'Custom prePackage step'),
 *   },
 * };
 * ```
 */
export const createHookWithTask = <Hook extends ForgeHookName>(
  hookFn: <Ctx = never>(
    task: ForgeListrTask<Ctx> | null,
    ...args: Parameters<ForgeHookFn<Hook>>
  ) => ReturnType<ForgeHookFn<Hook>>,
  name: string,
): ForgeHookFn<Hook> => {
  function namedHookWithTaskInner(
    this: ForgeListrTask<any> | null,
    ...args: any[]
  ) {
    return (hookFn as any)(this, ...args);
  }
  const fn = namedHookWithTaskInner as any;
  fn.__hookName = name;
  return fn;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export { Plugin as PluginBase };
