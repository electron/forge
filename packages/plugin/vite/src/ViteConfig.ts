import debug from 'debug';
import { loadConfigFromFile, mergeConfig } from 'vite';

import { getConfig as getMainViteConfig } from './config/vite.main.config';
import { getConfig as getPreloadViteConfig } from './config/vite.preload.config';
import { getConfig as getRendererViteConfig } from './config/vite.renderer.config';

import type { VitePluginBuildConfig, VitePluginConfig, VitePluginRendererConfig } from './Config';
import type { ConfigEnv, UserConfig } from 'vite';

const d = debug('@electron-forge/plugin-vite:ViteConfig');

type Target = NonNullable<VitePluginBuildConfig['target']> | 'renderer';

export default class ViteConfigGenerator {
  constructor(private readonly pluginConfig: VitePluginConfig, private readonly projectDir: string, private readonly isProd: boolean) {
    d('Config mode:', this.mode);
  }

  async resolveConfig(buildConfig: VitePluginBuildConfig | VitePluginRendererConfig, target: Target): Promise<UserConfig> {
    const configEnv: ConfigEnv = {
      // @see - https://vitejs.dev/config/#conditional-config
      command: this.isProd ? 'build' : 'serve',
      // `mode` affects `.env.[mode]` file load.
      mode: this.mode,

      // Forge extension variables.
      root: this.projectDir,
      forgeConfig: this.pluginConfig,
      forgeConfigSelf: buildConfig,
    };

    // `configEnv` is to be passed as an arguments when the user export a function in `vite.config.js`.
    const userConfig = (await loadConfigFromFile(configEnv, buildConfig.config))?.config ?? {};
    switch (target) {
      case 'main':
        return mergeConfig(getMainViteConfig(configEnv as ConfigEnv<'build'>), userConfig);
      case 'preload':
        return mergeConfig(getPreloadViteConfig(configEnv as ConfigEnv<'build'>), userConfig);
      case 'renderer':
        return mergeConfig(getRendererViteConfig(configEnv as ConfigEnv<'renderer'>), userConfig);
      default:
        throw new Error(`Unknown target: ${target}, expected 'main', 'preload' or 'renderer'`);
    }
  }

  get mode(): string {
    // Vite's `mode` can be passed in via command.
    // Since we are currently using the JavaScript API, we are opinionated defining two default values for mode here.
    // The `mode` set by the end user in `vite.config.js` has a higher priority.
    return this.isProd ? 'production' : 'development';
  }

  async getBuildConfig(): Promise<UserConfig[]> {
    if (!Array.isArray(this.pluginConfig.build)) {
      throw new Error('"config.build" must be an Array');
    }

    const configs = this.pluginConfig.build
      // Prevent load the default `vite.config.js` file.
      .filter(({ config }) => config)
      .map((buildConfig) => this.resolveConfig(buildConfig, buildConfig.target ?? 'main'));

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
