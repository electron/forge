import * as path from 'path';

import { PluginBase, StartOptions } from '@electron-forge/plugin-base';
import { ForgeHookFn } from '@electron-forge/shared-types';

import { CompilePluginConfig } from './Config';
import { createCompileHook } from './lib/compile-hook';

export default class CompilePlugin extends PluginBase<CompilePluginConfig> {
  name = 'electron-compile';

  private dir!: string;

  constructor(c: CompilePluginConfig) {
    super(c);

    this.init = this.init.bind(this);
    this.getHook = this.getHook.bind(this);
    this.startLogic = this.startLogic.bind(this);
  }

  init(dir: string): void {
    this.dir = dir;
  }

  getHook(hookName: string): ForgeHookFn | null {
    if (hookName === 'packageAfterCopy') {
      return createCompileHook(this.dir);
    }
    return null;
  }

  async startLogic(_opts: StartOptions): Promise<string[]> {
    return [process.execPath, path.resolve(this.dir, 'node_modules/electron-prebuilt-compile/lib/cli')];
  }
}

export { CompileElectronPlugin, CompilePluginConfig };
