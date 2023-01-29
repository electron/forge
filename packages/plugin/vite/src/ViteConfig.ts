import path from 'node:path';

import debug from 'debug';
import { ConfigEnv, loadConfigFromFile, mergeConfig, UserConfig } from 'vite';

import { VitePluginConfig } from './Config';
import { externalBuiltins } from './util/plugins';

const d = debug('electron-forge:plugin:vite:viteconfig');

/**
 * Vite allows zero-config runs, if the user does not provide `vite.config.js`,
 * then the value of `LoadResult` will become `null`.
 */
export type LoadResult = Awaited<ReturnType<typeof loadConfigFromFile>>;

export default class ViteConfigGenerator {
```suggestion
  private readonly baseDir: string;

  private _rendererConfig!: Promise<UserConfig>[];

  constructor(
    private readonly pluginConfig: VitePluginConfig,
    private readonly projectDir: string,
    private readonly isProd: boolean,
  ) {
    this.baseDir = path.join(projectDir, '.vite');
    d('Config mode:', this.mode);
  }

  resolveConfig(config: string, configEnv: Partial<ConfigEnv> = {}) {
    // `command` is to be passed as an arguments when the user export a function in `vite.config.js`.
    // @see - https://vitejs.dev/config/#conditional-config
    configEnv.command ??= this.isProd ? 'build' : 'serve';
    // `mode` affects `.env.[mode]` file loading.
    configEnv.mode ??= this.mode;
    return loadConfigFromFile(configEnv as ConfigEnv, config);
  }

  get mode(): string {
    // Vite's `mode` can be passed in via command.
    // Since we are currently using the JavaScript API, we are opinionated defining two default values for mode here.
    // The `mode` set by the end user in `vite.config.js` has a higher priority.
    return this.isProd ? 'production' : 'development';
  }

  async getDefines(): Promise<Record<string, string>> {
    const defines: Record<string, any> = {};
    const rendererConfigs = await Promise.all(this.getRendererConfig());
    for (const [index, userConfig] of rendererConfigs.entries()) {
      const name = this.pluginConfig.renderer[index].name;
      if (!name) {
        continue;
      }
      const NAME = name.toUpperCase().replace(/ /g, '_');
      // There is no guarantee that `port` will always be available, because it may auto increment.
      // https://github.com/vitejs/vite/blob/v4.0.4/packages/vite/src/node/http.ts#L170
      defines[`${NAME}_VITE_SERVER_URL`] = this.isProd ? undefined : userConfig?.server?.port && JSON.stringify(`http://localhost:${userConfig.server.port}`);
      defines[`${NAME}_VITE_NAME`] = JSON.stringify(name);
    }
    return defines;
  }

  getBuildConfig(watch = false): Promise<UserConfig>[] {
    if (!Array.isArray(this.pluginConfig.build)) {
      throw new Error('"config.build" must be an Array');
    }

    return this.pluginConfig.build
      .filter(({ entry, config }) => entry || config)
      .map(async ({ entry, config }) => {
        const defaultConfig: UserConfig = {
          // Ensure that each build config loads the .env file correctly.
          mode: this.mode,
          build: {
            lib: entry
              ? {
                  entry,
                  // Electron can only support cjs.
                  formats: ['cjs'],
                  fileName: () => '[name].js',
                }
              : undefined,
            // Prevent multiple builds from interfering with each other.
            emptyOutDir: false,
            // 🚧 Multiple builds may conflict.
            outDir: path.join(this.baseDir, 'build'),
            watch: watch ? {} : undefined,
          },
          clearScreen: false,
          define: await this.getDefines(),
          plugins: [externalBuiltins()],
        };
        if (config) {
          const loadResult = await this.resolveConfig(config);
          return mergeConfig(defaultConfig, loadResult?.config ?? {});
        }
        return defaultConfig;
      });
  }

  getRendererConfig(): Promise<UserConfig>[] {
    if (!Array.isArray(this.pluginConfig.renderer)) {
      throw new Error('"config.renderer" must be an Array');
    }

    let port = 5173;

    return (this._rendererConfig ??= this.pluginConfig.renderer.map(async ({ name, config }) => {
      const defaultConfig: UserConfig = {
        // Ensure that each build config loads the .env file correctly.
        mode: this.mode,
        // Make sure that Electron can be loaded into the local file using `loadFile` after packaging.
        base: './',
        build: {
          outDir: path.join(this.baseDir, 'renderer', name),
        },
        clearScreen: false,
      };
      const loadResult = (await this.resolveConfig(config)) ?? { path: '', config: {}, dependencies: [] };
      loadResult.config.server ??= {};
      loadResult.config.server.port ??= port++;
      return mergeConfig(defaultConfig, loadResult.config);
    }));
  }
}
