import { ForgeConfig, ForgeHookFn, IForgePlugin, StartOptions } from '@electron-forge/shared-types';
import { ChildProcess } from 'child_process';

export { StartOptions };

export default abstract class Plugin<C> implements IForgePlugin {
  public abstract name: string;
  /* tslint:disable variable-name */
  __isElectronForgePlugin!: true;
  /* tslint:enable variable-name */

  constructor(public config: C) {
    Object.defineProperty(this, '__isElectronForgePlugin', {
      value: true,
      enumerable: false,
      configurable: false,
    });
  }

  init(dir: string, config: ForgeConfig) {
  }

  getHook(hookName: string): ForgeHookFn | null {
    return null;
  }

  async startLogic(startOpts: StartOptions): Promise<ChildProcess | string | string[] | false> {
    return false;
  }
}
