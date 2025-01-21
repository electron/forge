import { PluginBase } from '@electron-forge/plugin-base';
import {
  ForgeListrTaskDefinition,
  ForgeMutatingHookFn,
  ForgeMutatingHookSignatures,
  ForgeSimpleHookFn,
  ForgeSimpleHookSignatures,
  IForgePlugin,
  IForgePluginInterface,
  ResolvedForgeConfig,
  StartResult,
} from '@electron-forge/shared-types';
import { autoTrace } from '@electron-forge/tracer';
import chalk from 'chalk';
import debug from 'debug';

// eslint-disable-next-line n/no-missing-import
import { StartOptions } from '../api';

import importSearch from './import-search';

const d = debug('electron-forge:plugins');

function isForgePlugin(plugin: IForgePlugin | unknown): plugin is IForgePlugin {
  return (plugin as IForgePlugin).__isElectronForgePlugin;
}

export default class PluginInterface implements IForgePluginInterface {
  private plugins: IForgePlugin[] = [];
  private _pluginPromise: Promise<void> = Promise.resolve();

  private config: ResolvedForgeConfig;

  static async create(dir: string, forgeConfig: ResolvedForgeConfig): Promise<PluginInterface> {
    const int = new PluginInterface(dir, forgeConfig);
    await int._pluginPromise;
    return int;
  }

  private constructor(dir: string, forgeConfig: ResolvedForgeConfig) {
    this._pluginPromise = Promise.all(
      forgeConfig.plugins.map(async (plugin): Promise<IForgePlugin> => {
        if (isForgePlugin(plugin)) {
          return plugin;
        }

        if (typeof plugin === 'object' && 'name' in plugin && 'config' in plugin) {
          const { name: pluginName, config: opts } = plugin;
          if (typeof pluginName !== 'string') {
            throw new Error(`Expected plugin[0] to be a string but found ${pluginName}`);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Plugin = await importSearch<any>(dir, [pluginName]);
          if (!Plugin) {
            throw new Error(`Could not find module with name: ${pluginName}. Make sure it's listed in the devDependencies of your package.json`);
          }
          return new Plugin(opts);
        }

        throw new Error(`Expected plugin to either be a plugin instance or a { name, config } object but found ${JSON.stringify(plugin)}`);
      })
    ).then((plugins) => {
      this.plugins = plugins;
      for (const plugin of this.plugins) {
        plugin.init(dir, forgeConfig);
      }
      return;
    });
    // TODO: fix hack
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.config = null as any;
    Object.defineProperty(this, 'config', {
      value: forgeConfig,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    this.triggerHook = this.triggerHook.bind(this);
    this.overrideStartLogic = this.overrideStartLogic.bind(this);
  }

  async triggerHook<Hook extends keyof ForgeSimpleHookSignatures>(hookName: Hook, hookArgs: ForgeSimpleHookSignatures[Hook]): Promise<void> {
    for (const plugin of this.plugins) {
      if (typeof plugin.getHooks === 'function') {
        let hooks = plugin.getHooks()[hookName] as ForgeSimpleHookFn<Hook>[] | ForgeSimpleHookFn<Hook>;
        if (hooks) {
          if (typeof hooks === 'function') hooks = [hooks];
          for (const hook of hooks) {
            await hook(this.config, ...hookArgs);
          }
        }
      }
    }
  }

  async getHookListrTasks<Hook extends keyof ForgeSimpleHookSignatures>(
    childTrace: typeof autoTrace,
    hookName: Hook,
    hookArgs: ForgeSimpleHookSignatures[Hook]
  ): Promise<ForgeListrTaskDefinition[]> {
    const tasks: ForgeListrTaskDefinition[] = [];

    for (const plugin of this.plugins) {
      if (typeof plugin.getHooks === 'function') {
        let hooks = plugin.getHooks()[hookName] as ForgeSimpleHookFn<Hook>[] | ForgeSimpleHookFn<Hook>;
        if (hooks) {
          if (typeof hooks === 'function') hooks = [hooks];
          for (const hook of hooks) {
            tasks.push({
              title: `${chalk.cyan(`[plugin-${plugin.name}]`)} ${(hook as any).__hookName || `Running ${chalk.yellow(hookName)} hook`}`,
              task: childTrace(
                { name: 'forge-plugin-hook', category: '@electron-forge/hooks', extraDetails: { plugin: plugin.name, hook: hookName } },
                async (_, __, task) => {
                  if ((hook as any).__hookName) {
                    // Also give it the task
                    return await (hook as any).call(task, this.config, ...(hookArgs as any[]));
                  } else {
                    await hook(this.config, ...hookArgs);
                  }
                }
              ),
              rendererOptions: {},
            });
          }
        }
      }
    }

    return tasks;
  }

  async triggerMutatingHook<Hook extends keyof ForgeMutatingHookSignatures>(
    hookName: Hook,
    ...item: ForgeMutatingHookSignatures[Hook]
  ): Promise<ForgeMutatingHookSignatures[Hook][0]> {
    let result: ForgeMutatingHookSignatures[Hook][0] = item[0];
    for (const plugin of this.plugins) {
      if (typeof plugin.getHooks === 'function') {
        let hooks = plugin.getHooks()[hookName] as ForgeMutatingHookFn<Hook>[] | ForgeMutatingHookFn<Hook>;
        if (hooks) {
          if (typeof hooks === 'function') hooks = [hooks];
          for (const hook of hooks) {
            result = (await hook(this.config, ...item)) || result;
          }
        }
      }
    }
    return result;
  }

  async overrideStartLogic(opts: StartOptions): Promise<StartResult> {
    let newStartFn;
    const claimed: string[] = [];
    for (const plugin of this.plugins) {
      if (typeof plugin.startLogic === 'function' && plugin.startLogic !== PluginBase.prototype.startLogic) {
        claimed.push(plugin.name);
        newStartFn = plugin.startLogic;
      }
    }
    if (claimed.length > 1) {
      throw new Error(`Multiple plugins tried to take control of the start command, please remove one of them\n --> ${claimed.join(', ')}`);
    }
    if (claimed.length === 1 && newStartFn) {
      d(`plugin: "${claimed[0]}" has taken control of the start command`);
      const result = await newStartFn(opts);
      if (typeof result === 'object' && 'tasks' in result) {
        result.tasks = result.tasks.map((task) => ({
          ...task,
          title: `${chalk.cyan(`[plugin-${claimed[0]}]`)} ${task.title}`,
        }));
      }
      return result;
    }
    return false;
  }
}
