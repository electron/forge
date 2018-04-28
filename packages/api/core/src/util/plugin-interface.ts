import { asyncOra } from '@electron-forge/async-ora';
import { IForgePluginInterface, ForgeConfig, IForgePlugin } from '@electron-forge/shared-types';
import { ChildProcess } from 'child_process';
import debug from 'debug';
import { StartOptions } from '../api';

const d = debug('electron-forge:plugins');

export default class PluginInterface implements IForgePluginInterface {
  private plugins: IForgePlugin[];
  private config: ForgeConfig;

  constructor(dir: string, forgeConfig: ForgeConfig) {
    this.plugins = forgeConfig.plugins.map((plugin) => {
      if ((plugin as IForgePlugin).__isElectronForgePlugin) {
        return plugin;
      } else if (Array.isArray(plugin)) {
        if (typeof plugin[0] !== 'string') {
          throw `Expected plugin[0] to be a string but found ${plugin[0]}`;
        }
        let opts = {};
        if (typeof plugin[1] !== 'undefined') opts = plugin[1];
        const pluginModule = require(plugin[0]);
        const Plugin = pluginModule.default || pluginModule;
        return new Plugin(opts);
      }
      throw `Expected plugin to either be a plugin instance or [string, object] but found ${plugin}`; // eslint-disable-line
    });
    // Fix linting
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

  async triggerHook(hookName: string, hookArgs: any[]) {
    for (const plugin of this.plugins) {
      if (typeof plugin.getHook === 'function') {
        const hook = plugin.getHook(hookName);
        if (hook) await hook(this.config, ...hookArgs);
      }
    }
  }

  // FIXME: any
  async overrideStartLogic(opts: StartOptions) {
    let newStartFn;
    const claimed = [];
    for (const plugin of this.plugins) {
      if (typeof plugin.startLogic === 'function') {
        claimed.push(plugin.name);
        newStartFn = plugin.startLogic;
      }
    }
    if (claimed.length > 1) throw `Multiple plugins tried to take control of the start command, please remove one of them\n --> ${claimed.join(', ')}`;
    if (claimed.length === 1 && newStartFn) {
      d(`plugin: "${claimed[0]}" has taken control of the start command`);
      return await newStartFn(opts);
    }
    return false;
  }
}
