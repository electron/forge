import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';

const d = debug('electron-forge:plugins');

export default class PluginInterface {
  constructor(dir, forgeConfig) {
    this.plugins = forgeConfig.plugins;
    Object.defineProperty(this, 'config', {
      value: forgeConfig,
      enumerable: false,
      configurable: false,
      writable: false,
    });

    for (const plugin of this.plugins) {
      plugin.init(dir, forgeConfig, asyncOra);
    }

    this.triggerHook = this.triggerHook.bind(this);
    this.overrideStartLogic = this.overrideStartLogic.bind(this);
  }

  async triggerHook(hookName, hookArgs) {
    for (const plugin of this.plugins) {
      if (typeof plugin.getHook === 'function') {
        const hook = plugin.getHook(hookName);
        if (hook) await hook(...hookArgs);
      }
    }
  }

  async overrideStartLogic(opts) {
    let newStartFn;
    const claimed = [];
    for (const plugin of this.plugins) {
      if (typeof plugin.startLogic === 'function') {
        claimed.push(plugin.name);
        newStartFn = plugin.startLogic;
      }
    }
    if (claimed.length > 1) throw `Multiple plugins tried to take control of the start command, please remove one of them\n --> ${claimed.join(', ')}`;
    if (claimed.length === 1) {
      d(`plugin: "${claimed[0]}" has taken control of the start command`);
      return await newStartFn(opts);
    }
    return false;
  }
}
