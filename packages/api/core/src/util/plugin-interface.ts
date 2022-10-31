import { PluginBase } from '@electron-forge/plugin-base';
import {
  ForgeMutatingHookFn,
  ForgeMutatingHookSignatures,
  ForgeSimpleHookFn,
  ForgeSimpleHookSignatures,
  IForgePlugin,
  IForgePluginInterface,
  ResolvedForgeConfig,
  StartResult,
} from '@electron-forge/shared-types';
import debug from 'debug';

import { StartOptions } from '../api';

import requireSearch from './require-search';

const d = debug('electron-forge:plugins');

function isForgePlugin(plugin: IForgePlugin | unknown): plugin is IForgePlugin {
  return (plugin as IForgePlugin).__isElectronForgePlugin;
}

export default class PluginInterface implements IForgePluginInterface {
  private plugins: IForgePlugin[];

  private config: ResolvedForgeConfig;

  constructor(dir: string, forgeConfig: ResolvedForgeConfig) {
    this.plugins = forgeConfig.plugins.map((plugin) => {
      if (isForgePlugin(plugin)) {
        return plugin;
      }

      if (typeof plugin === 'object' && 'name' in plugin && 'config' in plugin) {
        const { name: pluginName, config: opts } = plugin;
        if (typeof pluginName !== 'string') {
          throw new Error(`Expected plugin[0] to be a string but found ${pluginName}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Plugin = requireSearch<any>(dir, [pluginName]);
        if (!Plugin) {
          throw new Error(`Could not find module with name: ${pluginName}. Make sure it's listed in the devDependencies of your package.json`);
        }
        return new Plugin(opts);
      }

      throw new Error(`Expected plugin to either be a plugin instance or a { name, config } object but found ${plugin}`);
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

    for (const plugin of this.plugins) {
      plugin.init(dir, forgeConfig);
    }

    this.triggerHook = this.triggerHook.bind(this);
    this.overrideStartLogic = this.overrideStartLogic.bind(this);
  }

  async triggerHook<Hook extends keyof ForgeSimpleHookSignatures>(hookName: Hook, hookArgs: ForgeSimpleHookSignatures[Hook]): Promise<void> {
    for (const plugin of this.plugins) {
      if (typeof plugin.getHooks === 'function') {
        const hook = plugin.getHooks()[hookName] as ForgeSimpleHookFn<Hook>;
        if (hook) await hook(this.config, ...hookArgs);
      }
    }
  }

  async triggerMutatingHook<Hook extends keyof ForgeMutatingHookSignatures>(
    hookName: Hook,
    ...item: ForgeMutatingHookSignatures[Hook]
  ): Promise<ForgeMutatingHookSignatures[Hook][0]> {
    let result: ForgeMutatingHookSignatures[Hook][0] = item[0];
    for (const plugin of this.plugins) {
      if (typeof plugin.getHooks === 'function') {
        const hook = plugin.getHooks()[hookName] as ForgeMutatingHookFn<Hook>;
        if (hook) {
          result = (await hook(this.config, ...item)) || result;
        }
      }
    }
    return result;
  }

  async overrideStartLogic(opts: StartOptions): Promise<StartResult> {
    let newStartFn;
    const claimed = [];
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
      return newStartFn(opts);
    }
    return false;
  }
}
