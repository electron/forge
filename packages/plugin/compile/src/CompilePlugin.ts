import PluginBase, { StartOptions } from '@electron-forge/plugin-base';
import * as path from 'path';

import { CompilePluginConfig } from './Config';
import { createCompileHook } from './lib/compile-hook';

export default class LocalElectronPlugin extends PluginBase<CompilePluginConfig> {
  name = 'electron-compile';

  private dir!: string;

  constructor(c: CompilePluginConfig) {
    super(c);

    this.init = this.init.bind(this);
    this.getHook = this.getHook.bind(this);
    this.startLogic = this.startLogic.bind(this);
  }

  init(dir: string) {
    this.dir = dir;
  }

  getHook(hookName: string) {
    if (hookName === 'packageAfterCopy') {
      return createCompileHook(this.dir);
    }
    return null;
  }

  async startLogic(_opts: StartOptions) {
    return [process.execPath, path.resolve(this.dir, 'node_modules/electron-prebuilt-compile/lib/cli')];
  }
}
