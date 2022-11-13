import path from 'node:path';

import debug from 'debug';
import { ConfigEnv, InlineConfig, loadConfigFromFile, mergeConfig, UserConfig } from 'vite';

import { VitePluginConfig } from './Config';
import { externalBuiltins } from './util/plugins';

const d = debug('electron-forge:plugin:vite:viteconfig');

/**
 * Vite allows zero-config runs, if the user does not provide `vite.config.js`,
 * then the value of `LoadResult` will become `null`.
 */
export type LoadResult = Awaited<ReturnType<typeof loadConfigFromFile>>;

export default class ViteConfigGenerator {
  static resolveInlineConfig(options: VitePluginConfig['CLIOptions'] = {}): InlineConfig {
    return {
      // https://github.com/vitejs/vite/blob/v4.0.4/packages/vite/src/node/cli.ts#L123-L132
      // TODO: support alias
      base: options.base,
      mode: options.mode,
      configFile: options.config,
      logLevel: options.logLevel,
      clearScreen: options.clearScreen,
      optimizeDeps: { force: options.force },
      server: {
        host: options.host,
        port: options.port,
        https: options.https,
        open: options.open,
        cors: options.cors,
        strictPort: options.strictPort,
      },
    };
  }

  private isProd: boolean;

  private pluginConfig: VitePluginConfig;

  private projectDir!: string;

  private baseDir!: string;

  // Renderer config
  loadResult: LoadResult;

  // Vite's command config.
  inlineConfig: InlineConfig;

  constructor(pluginConfig: VitePluginConfig, projectDir: string, isProd: boolean, loadResult: LoadResult) {
    this.pluginConfig = pluginConfig;
    this.projectDir = projectDir;
    this.baseDir = path.join(projectDir, '.vite');
    this.isProd = isProd;
    this.loadResult = loadResult;
    this.inlineConfig = ViteConfigGenerator.resolveInlineConfig(this.pluginConfig.CLIOptions);

    d('Config mode:', this.mode);
  }

  async resolveConfig(config: string, configEnv: Partial<ConfigEnv> = {}) {
    configEnv.command ??= 'build'; // should always build.
    configEnv.mode ??= this.mode;
    return loadConfigFromFile(configEnv as ConfigEnv, config);
  }

  get mode(): string {
    return this.inlineConfig.mode ?? (this.isProd ? 'production' : 'development');
  }

  getDefines(): Record<string, string> {
    const port = this.loadResult?.config.server?.port ?? 5173;
    return { VITE_DEV_SERVER_URL: this.isProd ? (undefined as any) : `'http://localhost:${port}'` };
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
          define: this.getDefines(),
          plugins: [externalBuiltins()],
        };
        if (config) {
          const loadResult = await this.resolveConfig(config);
          return mergeConfig(defaultConfig, loadResult?.config ?? {});
        }
        return defaultConfig;
      });
  }

  getRendererConfig(): UserConfig {
    return mergeConfig(
      <UserConfig>{
        // Make sure that Electron can be loaded into the local file using `loadFile` after packaging.
        base: './',
        build: {
          outDir: path.join(this.baseDir, 'renderer'),
        },
      },
      this.loadResult?.config ?? {}
    );
  }
}
