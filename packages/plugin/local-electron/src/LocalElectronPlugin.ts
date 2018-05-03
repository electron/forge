import PluginBase from '@electron-forge/plugin-base';
import { spawn } from 'child_process';
import fs from 'fs-extra';

import { LocalElectronPluginConfig } from './Config';

export default class LocalElectronPlugin extends PluginBase<LocalElectronPluginConfig> {
  name = 'local-electron';

  constructor(config: LocalElectronPluginConfig) {
    super(config);
    if (typeof this.config.enabled === 'undefined') {
      this.config = {
        ...this.config,
        enabled: true,
      };
    }
  }

  async startLogic() {
    if (this.config.enabled) {
      this.checkPlatform(process.platform);
      process.env.ELECTRON_OVERRIDE_DIST_PATH = this.config.electronPath;
    }
    return false as any;
  }

  getHook(hookName: string) {
    if (hookName === 'packageAfterExtract') {
      return this.afterExtract;
    }
    return null;
  }

  private checkPlatform = (platform: string) => {
    if ((this.config.electronPlatform || process.platform) !== platform) {
      throw `Can not use local Electron version, required platform "${platform}" but local platform is "${this.config.electronPlatform || process.platform}"`;
    }
  }

  private checkArch = (arch: string) => {
    if ((this.config.electronArch || process.arch) !== arch) {
      throw `Can not use local Electron version, required arch "${arch}" but local arch is "${this.config.electronArch || process.arch}"`;
    }
  }

  private afterExtract = async (_: any, buildPath: string, __: any, platform: string, arch: string) => {
    if (!this.config.enabled) return;

    this.checkPlatform(platform);
    this.checkArch(arch);

    await fs.remove(buildPath);

    await fs.copy(this.config.electronPath, buildPath);
  }
}
