import PluginBase, { StartOptions } from '@electron-forge/plugin-base';
import * as path from 'path';

import { CompilePluginConfig } from './Config';
import { createCompileHook } from './lib/compile-hook';

export default class LocalElectronPlugin extends PluginBase<CompilePluginConfig> {
  name = 'electron-compile';
  private dir!: string;

  init(dir: string) {
    this.dir = dir;
  }

  getHook(hookName: string) {
    if (hookName === 'packageAfterCopy') {
      return createCompileHook(this.dir);
    }
    return null;
  }

  async startLogic(opts: StartOptions) {
    return [process.execPath, path.resolve(this.dir, 'node_modules/electron-prebuilt-compile/lib/cli')];
  }
}
