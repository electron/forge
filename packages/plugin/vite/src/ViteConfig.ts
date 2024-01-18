import debug from 'debug';
// eslint-disable-next-line node/no-unpublished-import
import { loadConfigFromFile } from 'vite';

import type { VitePluginConfig } from './Config';
// eslint-disable-next-line node/no-unpublished-import
import type { ConfigEnv, UserConfig } from 'vite';

const d = debug('@electron-forge/plugin-vite:ViteConfig');

export default class ViteConfigGenerator {
  private rendererConfigCache!: Promise<UserConfig>[];

  constructor(private readonly pluginConfig: VitePluginConfig, private readonly projectDir: string, private readonly isProd: boolean) {
    d('Config mode:', this.mode);
  }

  resolveConfig(config: string, configEnv: Partial<ConfigEnv> = {}) {
    // @see - https://vitejs.dev/config/#conditional-config
    configEnv.command ??= this.isProd ? 'build' : 'serve';
    // `mode` affects `.env.[mode]` file load.
    configEnv.mode ??= this.mode;

    // Hack! Pass the runtime path to the vite config file in the template.
    Object.assign(configEnv, { root: this.projectDir });

    // `configEnv` is to be passed as an arguments when the user export a function in `vite.config.js`.
    return loadConfigFromFile(configEnv as ConfigEnv, config);
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
      .filter(({ config }) => config)
      .map<Promise<UserConfig>>(async ({ config }) => (await this.resolveConfig(config))?.config ?? {});

    return await Promise.all(configs);
  }

  async getRendererConfig(): Promise<UserConfig[]> {
    if (!Array.isArray(this.pluginConfig.renderer)) {
      throw new Error('"config.renderer" must be an Array');
    }

    const configs = (this.rendererConfigCache ??= this.pluginConfig.renderer.map(async ({ config }) => (await this.resolveConfig(config))?.config ?? {}));

    return await Promise.all(configs);
  }
}
