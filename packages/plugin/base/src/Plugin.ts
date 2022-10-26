import { ElectronProcess, ForgeHookMap, IForgePlugin, ResolvedForgeConfig, StartOptions } from '@electron-forge/shared-types';

export { StartOptions };

export default abstract class Plugin<C> implements IForgePlugin {
  public abstract name: string;

  /** @internal */
  __isElectronForgePlugin!: true;
  /** @internal */
  _resolvedHooks: ForgeHookMap = {};

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

  getHooks(): ForgeHookMap {
    return {};
  }

  async startLogic(_startOpts: StartOptions): Promise<ElectronProcess | string | string[] | false> {
    return false;
  }
}

export { Plugin as PluginBase };
