import { ForgeConfig, ForgeHookFn } from '@electron-forge/shared-types';
import PluginBase from '@electron-forge/plugin-base';
import fs from 'fs-extra';

import { LocalElectronPluginConfig } from './Config';

export default class LocalElectronPlugin extends PluginBase<LocalElectronPluginConfig> {
  name = 'local-electron';

  constructor(c: LocalElectronPluginConfig) {
    super(c);

    this.getHook = this.getHook.bind(this);
    this.startLogic = this.startLogic.bind(this);
  }

  get enabled(): boolean {
    if (typeof this.config.enabled === 'undefined') {
      return true;
    }
    return this.config.enabled;
  }

  async startLogic(): Promise<false> {
    if (this.enabled) {
      this.checkPlatform(process.platform);
      process.env.ELECTRON_OVERRIDE_DIST_PATH = this.config.electronPath;
    }
    return false;
  }

  getHook(hookName: string): ForgeHookFn | null {
    if (hookName === 'packageAfterExtract') {
      return this.afterExtract;
    }
    return null;
  }

  private checkPlatform = (platform: string) => {
    if ((this.config.electronPlatform || process.platform) !== platform) {
      throw new Error(
        `Can not use local Electron version, required platform "${platform}" but local platform is "${this.config.electronPlatform || process.platform}"`
      );
    }
  };

  private checkArch = (arch: string) => {
    if ((this.config.electronArch || process.arch) !== arch) {
      throw new Error(`Can not use local Electron version, required arch "${arch}" but local arch is "${this.config.electronArch || process.arch}"`);
    }
  };

  private afterExtract = async (_config: ForgeConfig, buildPath: string, _electronVersion: string, platform: string, arch: string) => {
    if (!this.enabled) return;

    this.checkPlatform(platform);
    this.checkArch(arch);

    await fs.remove(buildPath);

    await fs.copy(this.config.electronPath, buildPath);
  };
}
