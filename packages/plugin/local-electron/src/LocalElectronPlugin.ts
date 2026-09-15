import { PluginBase } from '@electron-forge/plugin-base';
import { ForgeHookFn, ForgeHookMap } from '@electron-forge/shared-types';
import fs from 'fs-extra';

import { LocalElectronPluginConfig } from './Config';

export default class LocalElectronPlugin extends PluginBase<LocalElectronPluginConfig> {
  name = 'local-electron';

  constructor(c: LocalElectronPluginConfig) {
    super(c);

    this.getHooks = this.getHooks.bind(this);
  }

  get enabled(): boolean {
    if (typeof this.config.enabled === 'undefined') {
      return true;
    }
    return this.config.enabled;
  }

  getHooks(): ForgeHookMap {
    return {
      preStart: this.preStart,
      packageAfterExtract: this.afterExtract,
    };
  }

  private checkPlatform = (platform: string) => {
    if ((this.config.electronPlatform || process.platform) !== platform) {
      throw new Error(
        `Can not use local Electron version, required platform "${platform}" but local platform is "${this.config.electronPlatform || process.platform}"`,
      );
    }
  };

  private checkArch = (arch: string) => {
    if ((this.config.electronArch || process.arch) !== arch) {
      throw new Error(
        `Can not use local Electron version, required arch "${arch}" but local arch is "${this.config.electronArch || process.arch}"`,
      );
    }
  };

  private preStart: ForgeHookFn<'preStart'> = async () => {
    if (this.enabled) {
      this.checkPlatform(process.platform);
      process.env.ELECTRON_OVERRIDE_DIST_PATH = this.config.electronPath;
    }
  };

  private afterExtract: ForgeHookFn<'packageAfterExtract'> = async (
    _config,
    buildPath,
    _electronVersion,
    platform,
    arch,
  ) => {
    if (!this.enabled) return;

    this.checkPlatform(platform);
    this.checkArch(arch);

    await fs.remove(buildPath);

    await fs.copy(this.config.electronPath, buildPath);
  };
}

export { LocalElectronPlugin, LocalElectronPluginConfig };
