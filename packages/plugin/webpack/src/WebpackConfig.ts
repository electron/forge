import path from 'path';

import debug from 'debug';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, { Configuration, WebpackPluginInstance } from 'webpack';
import { merge as webpackMerge } from 'webpack-merge';

import { WebpackPluginConfig, WebpackPluginEntryPoint, WebpackPluginEntryPointLocalWindow, WebpackPluginEntryPointPreloadOnly } from './Config';
import AssetRelocatorPatch from './util/AssetRelocatorPatch';
import processConfig from './util/processConfig';
import { isLocalWindow, isNoWindow, isPreloadOnly } from './util/rendererTypeUtils';

type EntryType = string | string[] | Record<string, string | string[]>;
type WebpackMode = 'production' | 'development';

const d = debug('electron-forge:plugin:webpack:webpackconfig');

export type ConfigurationFactory = (
  env: string | Record<string, string | boolean | number> | unknown,
  args: Record<string, unknown>
) => Configuration | Promise<Configuration>;

enum RendererTarget {
  Web = 'web',
  ElectronRenderer = 'electron-renderer',
  ElectronPreload = 'electron-preload',
  SandboxedPreload = 'web',
}

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

  async resolveConfig(config: Configuration | ConfigurationFactory | string): Promise<Configuration> {
    const rawConfig =
      typeof config === 'string'
        ? // eslint-disable-next-line @typescript-eslint/no-var-requires
          (require(path.resolve(this.projectDir, config)) as Configuration | ConfigurationFactory)
        : config;

    return processConfig(this.preprocessConfig, rawConfig);
  }

  // Users can override this method in a subclass to provide custom logic or
  // configuration parameters.
  preprocessConfig = async (config: ConfigurationFactory): Promise<Configuration> =>
    config(
      {},
      {
        mode: this.mode,
      }
    );

  get mode(): WebpackMode {
    return this.isProd ? 'production' : 'development';
  }

  get rendererSourceMapOption(): string {
    return this.isProd ? 'source-map' : 'eval-source-map';
  }

  rendererTarget(entryPoint: WebpackPluginEntryPoint): string {
    return entryPoint.nodeIntegration ?? this.pluginConfig.renderer.nodeIntegration ? RendererTarget.ElectronRenderer : RendererTarget.Web;
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
    if (!isNoWindow(entryPoint)) {
      if (this.isProd) {
        return `require('path').resolve(__dirname, '../renderer', '${entryPoint.name}', 'preload.js')`;
      }
      return `'${path.resolve(this.webpackDir, 'renderer', entryPoint.name, 'preload.js').replace(/\\/g, '\\\\')}'`;
    } else {
      // If this entry-point has no configured preload script just map this constant to `undefined`
      // so that any code using it still works.  This makes quick-start / docs simpler.
      return 'undefined';
    }
  }

  getDefines(inRendererDir = true): Record<string, string> {
    const defines: Record<string, string> = {};
    if (!this.pluginConfig.renderer.entryPoints || !Array.isArray(this.pluginConfig.renderer.entryPoints)) {
      throw new Error('Required config option "renderer.entryPoints" has not been defined');
    }
    for (const entryPoint of this.pluginConfig.renderer.entryPoints) {
      const entryKey = this.toEnvironmentVariable(entryPoint);
      if (isLocalWindow(entryPoint)) {
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

  async getMainConfig(): Promise<Configuration> {
    const mainConfig = await this.resolveConfig(this.pluginConfig.mainConfig);

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

  async getPreloadConfigForEntryPoint(entryPoint: WebpackPluginEntryPointLocalWindow | WebpackPluginEntryPointPreloadOnly): Promise<Configuration> {
    if (!entryPoint.preload) {
      return {};
    }

    const rendererConfig = await this.resolveConfig(entryPoint.preload.config || this.pluginConfig.renderer.config);
    const prefixedEntries = entryPoint.prefixedEntries || [];

    return webpackMerge(
      {
        devtool: this.rendererSourceMapOption,
        mode: this.mode,
        entry: prefixedEntries.concat([entryPoint.preload.js]),
        output: {
          path: path.resolve(this.webpackDir, 'renderer', entryPoint.name),
          filename: 'preload.j s',
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

  async getRendererConfig2(entryPoints: WebpackPluginEntryPoint[]): Promise<Configuration[]> {
    const rendererConfig = await this.resolveConfig(this.pluginConfig.renderer.config);

    return entryPoints.map((entryPoint) => {
      const baseConfig: webpack.Configuration = {
        target: this.rendererTarget(entryPoint),
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
        plugins: [new AssetRelocatorPatch(this.isProd, !!this.pluginConfig.renderer.nodeIntegration)],
      };

      if (isLocalWindow(entryPoint)) {
        return webpackMerge(
          baseConfig,
          {
            entry: {
              [entryPoint.name]: (entryPoint.prefixedEntries || []).concat([entryPoint.js]),
            },
            output: {
              path: path.resolve(this.webpackDir, 'renderer'),
              filename: '[name]/index.js',
              globalObject: 'self',
              ...(this.isProd ? {} : { publicPath: '/' }),
            },
            plugins: [
              new HtmlWebpackPlugin({
                title: entryPoint.name,
                template: entryPoint.html,
                filename: `${entryPoint.name}/index.html`,
                chunks: [entryPoint.name].concat(entryPoint.additionalChunks || []),
              }) as WebpackPluginInstance,
            ],
          },
          rendererConfig || {}
        );
      } else if (isNoWindow(entryPoint)) {
        return webpackMerge(
          baseConfig,
          {
            entry: {
              [entryPoint.name]: (entryPoint.prefixedEntries || []).concat([entryPoint.js]),
            },
            output: {
              path: path.resolve(this.webpackDir, 'renderer'),
              filename: '[name]/index.js',
              globalObject: 'self',
              ...(this.isProd ? {} : { publicPath: '/' }),
            },
          },
          rendererConfig || {}
        );
      } else if (isPreloadOnly(entryPoint)) {
        return webpackMerge(
          baseConfig,
          {
            target: 'electron-preload',
            entry: {
              [entryPoint.name]: (entryPoint.prefixedEntries || []).concat([entryPoint.preload.js]),
            },
            output: {
              path: path.resolve(this.webpackDir, 'renderer'),
              filename: 'preload.js',
              globalObject: 'self',
              ...(this.isProd ? {} : { publicPath: '/' }),
            },
          },
          rendererConfig || {}
        );
      } else {
        throw new Error('Invalid renderer entry point detected.');
      }
    });
  }

  async getRendererConfig(entryPoints: WebpackPluginEntryPoint[]): Promise<Configuration[]> {
    const targets = {
      web: [] as (WebpackPluginEntryPointLocalWindow | WebpackPluginEntryPoint)[],
      electronRenderer: [] as (WebpackPluginEntryPointLocalWindow | WebpackPluginEntryPoint)[],
      electronPreload: [] as (WebpackPluginEntryPointPreloadOnly | WebpackPluginEntryPointLocalWindow)[],
      sandboxedPreload: [] as (WebpackPluginEntryPointPreloadOnly | WebpackPluginEntryPointLocalWindow)[],
    };
    for (const entry of entryPoints) {
      if (entry.nodeIntegration ?? this.pluginConfig.renderer.nodeIntegration) {
        // Has node
        if (isPreloadOnly(entry)) {
          targets.electronPreload.push(entry);
        } else {
          targets.electronRenderer.push(entry);
          if (isLocalWindow(entry) && entry.preload) {
            targets.electronPreload.push(entry);
          }
        }
      } else {
        // No node
        if (isPreloadOnly(entry)) {
          targets.sandboxedPreload.push(entry);
        } else {
          targets.web.push(entry);
          if (isLocalWindow(entry) && entry.preload) {
            targets.sandboxedPreload.push(entry);
          }
        }
      }
    }
    console.log('targets', targets);
    return [
      await this.buildRendererConfig(targets.web, RendererTarget.Web),
      await this.buildRendererConfig(targets.electronRenderer, RendererTarget.ElectronRenderer),
      await this.buildRendererConfig(targets.electronPreload, RendererTarget.ElectronPreload),
      await this.buildRendererConfig(targets.sandboxedPreload, RendererTarget.SandboxedPreload),
    ].filter(function isNotNull<T>(item: T | null): item is T {
      return !!item;
    });
  }

  buildRendererBaseConfig(target: RendererTarget): webpack.Configuration {
    return {
      target,
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
      plugins: [new AssetRelocatorPatch(this.isProd, !!this.pluginConfig.renderer.nodeIntegration)],
    };
  }

  async buildRendererConfig(entryPoints: WebpackPluginEntryPoint[], target: RendererTarget): Promise<Configuration | null> {
    const entry: webpack.Entry = {};

    if (entryPoints.length === 0) {
      return null;
    }
    const baseConfig: webpack.Configuration = this.buildRendererBaseConfig(target);
    const rendererConfig = await this.resolveConfig(this.pluginConfig.renderer.config);

    if (target === RendererTarget.Web || target === RendererTarget.ElectronRenderer) {
      for (const entryPoint of entryPoints) {
        entry[entryPoint.name] = (entryPoint.prefixedEntries || []).concat([isPreloadOnly(entryPoint) ? entryPoint.preload.js : entryPoint.js]);
      }
      const output = {
        path: path.resolve(this.webpackDir, 'renderer'),
        filename: '[name]/index.js',
        globalObject: 'self',
        ...(this.isProd ? {} : { publicPath: '/' }),
      };
      const plugins: webpack.WebpackPluginInstance[] = [];
      for (const entryPoint of entryPoints) {
        if (isLocalWindow(entryPoint)) {
          plugins.push(
            new HtmlWebpackPlugin({
              title: entryPoint.name,
              template: entryPoint.html,
              filename: `${entryPoint.name}/index.html`,
              chunks: [entryPoint.name].concat(entryPoint.additionalChunks || []),
            }) as WebpackPluginInstance
          );
        }
      }
      return webpackMerge(baseConfig, { entry, output, plugins }, rendererConfig || {});
    } else if (target === RendererTarget.ElectronPreload || target === RendererTarget.SandboxedPreload) {
      for (const entryPoint of entryPoints) {
        entry[entryPoint.name] = (entryPoint.prefixedEntries || []).concat([isPreloadOnly(entryPoint) ? entryPoint.preload.js : entryPoint.js]);
      }
      const config: Configuration = {
        target,
        entry,
        output: {
          path: path.resolve(this.webpackDir, 'renderer'),
          filename: 'preload.js',
          globalObject: 'self',
          ...(this.isProd ? {} : { publicPath: '/' }),
        },
        plugins:
          target === RendererTarget.ElectronPreload
            ? []
            : [new webpack.ExternalsPlugin('commonjs2', ['electron', 'electron/renderer', 'electron/common', 'events', 'timers', 'url'])],
      };
      return webpackMerge(baseConfig, config, rendererConfig);
    } else {
      throw new Error('Invalid renderer entry point detected.');
    }
  }
}
