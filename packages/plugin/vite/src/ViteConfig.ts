import path from 'node:path';

import { getElectronVersion, readJson } from '@electron-forge/core-utils';
import debug from 'debug';
import { loadConfigFromFile } from 'vite';

import { getElectronTargets } from './config/electron-targets.js';
import { getConfig as getMainViteConfig } from './config/vite.main.config.js';
import { getConfig as getPreloadViteConfig } from './config/vite.preload.config.js';
import { getConfig as getRendererViteConfig } from './config/vite.renderer.config.js';

import type {
  VitePluginBuildConfig,
  VitePluginConfig,
  VitePluginRendererConfig,
} from './Config.js';
import type { ElectronTargets } from './config/electron-targets.js';
import type { ConfigEnv, UserConfig } from 'vite';

const d = debug('@electron-forge/plugin-vite:ViteConfig');

type Target = NonNullable<VitePluginBuildConfig['target']> | 'renderer';

export default class ViteConfigGenerator {
  private electronTargets?: Promise<ElectronTargets>;

  constructor(
    private readonly pluginConfig: VitePluginConfig,
    private readonly projectDir: string,
    private readonly isProd: boolean,
  ) {
    d('Config mode:', this.mode);
  }

  /**
   * Build targets matching the Electron version installed in the project.
   * If that version cannot be determined (no `package.json`, no Electron
   * dependency, or Electron not installed) no target is derived and Vite's own
   * default applies.
   */
  private resolveElectronTargets(): Promise<ElectronTargets> {
    this.electronTargets ??= (async () => {
      try {
        const packageJSON = await readJson(
          path.join(this.projectDir, 'package.json'),
        );
        const version = await getElectronVersion(this.projectDir, packageJSON);
        const targets = getElectronTargets(version);
        d('Derived build targets from Electron %s:', version, targets);
        return targets;
      } catch (err) {
        d(
          'Could not determine the Electron version, leaving build.target unset:',
          err,
        );
        return {};
      }
    })();

    return this.electronTargets;
  }

  async resolveConfig(
    buildConfig: VitePluginBuildConfig | VitePluginRendererConfig,
    target: Target,
  ): Promise<UserConfig> {
    const configEnv: ConfigEnv = {
      // @see - https://vitejs.dev/config/#conditional-config
      command: this.isProd ? 'build' : 'serve',
      // `mode` affects `.env.[mode]` file load.
      mode: this.mode,

      // Forge extension variables.
      root: this.projectDir,
      forgeConfig: this.pluginConfig,
      forgeConfigSelf: buildConfig,
      electronTargets: await this.resolveElectronTargets(),
    };

    // `configEnv` is to be passed as an arguments when the user export a function in `vite.config.js`.
    const userConfig = (await loadConfigFromFile(configEnv, buildConfig.config))
      ?.config;
    switch (target) {
      case 'main':
        return getMainViteConfig(configEnv as ConfigEnv<'build'>, userConfig);
      case 'preload':
        return getPreloadViteConfig(
          configEnv as ConfigEnv<'build'>,
          userConfig,
        );
      case 'renderer':
        return getRendererViteConfig(
          configEnv as ConfigEnv<'renderer'>,
          userConfig,
        );
      default:
        throw new Error(
          `Unknown target: ${target}, expected 'main', 'preload' or 'renderer'`,
        );
    }
  }

  get mode(): string {
    // Vite's `mode` can be passed in via command.
    // Since we are currently using the JavaScript API, we are opinionated defining two default values for mode here.
    // The `mode` set by the end user in `vite.config.js` has a higher priority.
    return this.isProd ? 'production' : 'development';
  }

  async getBuildConfigs(): Promise<UserConfig[]> {
    if (!Array.isArray(this.pluginConfig.build)) {
      throw new Error('"config.build" must be an Array');
    }

    const configs = this.pluginConfig.build
      // Prevent load the default `vite.config.js` file.
      .filter(({ config }) => config)
      .map((buildConfig) =>
        this.resolveConfig(buildConfig, buildConfig.target ?? 'main'),
      );

    return await Promise.all(configs);
  }

  async getRendererConfig(): Promise<UserConfig[]> {
    if (!Array.isArray(this.pluginConfig.renderer)) {
      throw new Error('"config.renderer" must be an Array');
    }

    const configs = this.pluginConfig.renderer
      // Prevent load the default `vite.config.js` file.
      .filter(({ config }) => config)
      .map((buildConfig) => this.resolveConfig(buildConfig, 'renderer'));

    return await Promise.all(configs);
  }
}
