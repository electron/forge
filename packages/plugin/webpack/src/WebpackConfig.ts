import debug from 'debug';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack, { Configuration, WebpackPluginInstance } from 'webpack';
import { merge as webpackMerge } from 'webpack-merge';
import { WebpackPluginConfig, WebpackPluginEntryPoint, WebpackPreloadEntryPoint } from './Config';
import AssetRelocatorPatch from './util/AssetRelocatorPatch';

type EntryType = string | string[] | Record<string, string | string[]>;
type WebpackMode = 'production' | 'development';

const d = debug('electron-forge:plugin:webpack:webpackconfig');

export default class WebpackConfigGenerator {
  private isProd: boolean;

  private pluginConfig: WebpackPluginConfig;

  private port: number;

  private projectDir: string;

  private webpackDir: string;

  constructor(pluginConfig: WebpackPluginConfig, projectDir: string, isProd: boolean, port: number) {
    this.pluginConfig = pluginConfig;
    this.projectDir = projectDir;
    this.webpackDir = path.resolve(projectDir, '.webpack');
    this.isProd = isProd;
    this.port = port;

    d('Config mode:', this.mode);
  }

  resolveConfig(config: Configuration | string): Configuration {
    if (typeof config === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-dynamic-require, global-require
      return require(path.resolve(this.projectDir, config)) as Configuration;
    }

    return config;
  }

  get mode(): WebpackMode {
    return this.isProd ? 'production' : 'development';
  }

  get rendererSourceMapOption(): string {
    return this.isProd ? 'source-map' : 'eval-source-map';
  }

  get rendererTarget(): string {
    return this.pluginConfig.renderer.nodeIntegration ? 'electron-renderer' : 'web';
  }

  rendererEntryPoint(entryPoint: WebpackPluginEntryPoint, inRendererDir: boolean, basename: string): string {
    if (this.isProd) {
      return `\`file://$\{require('path').resolve(__dirname, '..', '${inRendererDir ? 'renderer' : '.'}', '${entryPoint.name}', '${basename}')}\``;
    }
    const baseUrl = `http://localhost:${this.port}/${entryPoint.name}`;
    if (basename !== 'index.html') {
      return `'${baseUrl}/${basename}'`;
    }
    return `'${baseUrl}'`;
  }

  toEnvironmentVariable(entryPoint: WebpackPluginEntryPoint, preload = false): string {
    const suffix = preload ? '_PRELOAD_WEBPACK_ENTRY' : '_WEBPACK_ENTRY';
    return `${entryPoint.name.toUpperCase().replace(/ /g, '_')}${suffix}`;
  }

  getPreloadDefine(entryPoint: WebpackPluginEntryPoint): string {
    if (entryPoint.preload) {
      if (this.isProd) {
        return `require('path').resolve(__dirname, '../renderer', '${entryPoint.name}', 'preload.js')`;
      }
      return `'${path.resolve(this.webpackDir, 'renderer', entryPoint.name, 'preload.js').replace(/\\/g, '\\\\')}'`;
    }
    // If this entry-point has no configured preload script just map this constant to `undefined`
    // so that any code using it still works.  This makes quick-start / docs simpler.
    return 'undefined';
  }

  getDefines(inRendererDir = true): Record<string, string> {
    const defines: Record<string, string> = {};
    if (!this.pluginConfig.renderer.entryPoints || !Array.isArray(this.pluginConfig.renderer.entryPoints)) {
      throw new Error('Required config option "renderer.entryPoints" has not been defined');
    }
    for (const entryPoint of this.pluginConfig.renderer.entryPoints) {
      const entryKey = this.toEnvironmentVariable(entryPoint);
      if (entryPoint.html) {
        defines[entryKey] = this.rendererEntryPoint(entryPoint, inRendererDir, 'index.html');
      } else {
        defines[entryKey] = this.rendererEntryPoint(entryPoint, inRendererDir, 'index.js');
      }
      defines[`process.env.${entryKey}`] = defines[entryKey];

      const preloadDefineKey = this.toEnvironmentVariable(entryPoint, true);
      defines[preloadDefineKey] = this.getPreloadDefine(entryPoint);
      defines[`process.env.${preloadDefineKey}`] = defines[preloadDefineKey];
    }
    return defines;
  }

  getMainConfig(): Configuration {
    const mainConfig = this.resolveConfig(this.pluginConfig.mainConfig);

    if (!mainConfig.entry) {
      throw new Error('Required option "mainConfig.entry" has not been defined');
    }
    const fix = (item: EntryType): EntryType => {
      if (typeof item === 'string') return (fix([item]) as string[])[0];
      if (Array.isArray(item)) {
        return item.map((val) => (val.startsWith('./') ? path.resolve(this.projectDir, val) : val));
      }
      const ret: Record<string, string | string[]> = {};
      for (const key of Object.keys(item)) {
        ret[key] = fix(item[key]) as string | string[];
      }
      return ret;
    };
    mainConfig.entry = fix(mainConfig.entry as EntryType);

    return webpackMerge(
      {
        devtool: 'source-map',
        target: 'electron-main',
        mode: this.mode,
        output: {
          path: path.resolve(this.webpackDir, 'main'),
          filename: 'index.js',
          libraryTarget: 'commonjs2',
        },
        plugins: [new webpack.DefinePlugin(this.getDefines())],
        node: {
          __dirname: false,
          __filename: false,
        },
      },
      mainConfig || {}
    );
  }

  async getPreloadRendererConfig(parentPoint: WebpackPluginEntryPoint, entryPoint: WebpackPreloadEntryPoint): Promise<Configuration> {
    const rendererConfig = this.resolveConfig(entryPoint.config || this.pluginConfig.renderer.config);
    const prefixedEntries = entryPoint.prefixedEntries || [];

    return webpackMerge(
      {
        devtool: this.rendererSourceMapOption,
        mode: this.mode,
        entry: prefixedEntries.concat([entryPoint.js]),
        output: {
          path: path.resolve(this.webpackDir, 'renderer', parentPoint.name),
          filename: 'preload.js',
        },
        node: {
          __dirname: false,
          __filename: false,
        },
      },
      rendererConfig || {},
      { target: 'electron-preload' }
    );
  }

  async getRendererConfig(entryPoints: WebpackPluginEntryPoint[]): Promise<Configuration[]> {
    const rendererConfig = this.resolveConfig(this.pluginConfig.renderer.config);
    const defines = this.getDefines(false);

    return entryPoints.map((entryPoint) => {
      const config = webpackMerge(
        {
          entry: {
            [entryPoint.name]: (entryPoint.prefixedEntries || []).concat([entryPoint.js]),
          },
          target: this.rendererTarget,
          devtool: this.rendererSourceMapOption,
          mode: this.mode,
          output: {
            path: path.resolve(this.webpackDir, 'renderer'),
            filename: '[name]/index.js',
            globalObject: 'self',
            ...(this.isProd ? {} : { publicPath: '/' }),
          },
          node: {
            __dirname: false,
            __filename: false,
          },
          plugins: [
            ...(entryPoint.html
              ? [
                  new HtmlWebpackPlugin({
                    title: entryPoint.name,
                    template: entryPoint.html,
                    filename: `${entryPoint.name}/index.html`,
                    chunks: [entryPoint.name].concat(entryPoint.additionalChunks || []),
                  }) as WebpackPluginInstance,
                ]
              : []),
            new webpack.DefinePlugin(defines),
            new AssetRelocatorPatch(this.isProd, !!this.pluginConfig.renderer.nodeIntegration),
          ],
        },
        rendererConfig || {}
      );

      if (entryPoint.target) {
        config.target = entryPoint.target;
      }

      return config;
    });
  }
}
