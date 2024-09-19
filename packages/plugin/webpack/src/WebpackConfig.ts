import path from 'path';

import debug from 'debug';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, { Configuration, WebpackPluginInstance } from 'webpack';
import { merge as webpackMerge } from 'webpack-merge';

import {
  WebpackPluginConfig,
  WebpackPluginEntryPoint,
  WebpackPluginEntryPointLocalWindow,
  WebpackPluginEntryPointPreloadOnly,
  WebpackPluginRendererConfig,
} from './Config';
import AssetRelocatorPatch from './util/AssetRelocatorPatch';
import processConfig from './util/processConfig';
import { isLocalOrNoWindowEntries, isLocalWindow, isNoWindow, isPreloadOnly, isPreloadOnlyEntries } from './util/rendererTypeUtils';

type EntryType = string | string[] | Record<string, string | string[]>;
type WebpackMode = 'production' | 'development';

const d = debug('electron-forge:plugin:webpack:webpackconfig');

export type ConfigurationFactory = (
  env: string | Record<string, string | boolean | number> | unknown,
  args: Record<string, unknown>
) => Configuration | Promise<Configuration>;

enum RendererTarget {
  Web,
  ElectronRenderer,
  ElectronPreload,
  SandboxedPreload,
}

enum WebpackTarget {
  Web = 'web',
  ElectronPreload = 'electron-preload',
  ElectronRenderer = 'electron-renderer',
}

function isNotNull<T>(item: T | null): item is T {
  return item !== null;
}

function rendererTargetToWebpackTarget(target: RendererTarget): WebpackTarget {
  switch (target) {
    case RendererTarget.Web:
    case RendererTarget.SandboxedPreload:
      return WebpackTarget.Web;
    case RendererTarget.ElectronPreload:
      return WebpackTarget.ElectronPreload;
    case RendererTarget.ElectronRenderer:
      return WebpackTarget.ElectronRenderer;
  }
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
    type MaybeESM<T> = T | { default: T };

    let rawConfig =
      typeof config === 'string'
        ? // eslint-disable-next-line @typescript-eslint/no-var-requires
          (require(path.resolve(this.projectDir, config)) as MaybeESM<Configuration | ConfigurationFactory>)
        : config;

    if (rawConfig && typeof rawConfig === 'object' && 'default' in rawConfig) {
      rawConfig = rawConfig.default;
    }

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

  rendererEntryPoint(entryPoint: WebpackPluginEntryPoint, basename: string): string {
    if (this.isProd) {
      return `\`file://$\{require('path').resolve(__dirname, '..', 'renderer', '${entryPoint.name}', '${basename}')}\``;
    }
    const protocol = this.pluginConfig.devServer?.server === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://localhost:${this.port}/${entryPoint.name}`;
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

  private get allPluginRendererOptions() {
    return Array.isArray(this.pluginConfig.renderer) ? this.pluginConfig.renderer : [this.pluginConfig.renderer];
  }

  getDefines(): Record<string, string> {
    const defines: Record<string, string> = {};

    for (const pluginRendererOptions of this.allPluginRendererOptions) {
      if (!pluginRendererOptions.entryPoints || !Array.isArray(pluginRendererOptions.entryPoints)) {
        throw new Error('Required config option "renderer.entryPoints" has not been defined');
      }
      for (const entryPoint of pluginRendererOptions.entryPoints) {
        const entryKey = this.toEnvironmentVariable(entryPoint);
        if (isLocalWindow(entryPoint)) {
          defines[entryKey] = this.rendererEntryPoint(entryPoint, 'index.html');
        } else {
          defines[entryKey] = this.rendererEntryPoint(entryPoint, 'index.js');
        }
        defines[`process.env.${entryKey}`] = defines[entryKey];

        const preloadDefineKey = this.toEnvironmentVariable(entryPoint, true);
        defines[preloadDefineKey] = this.getPreloadDefine(entryPoint);
        defines[`process.env.${preloadDefineKey}`] = defines[preloadDefineKey];
      }
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

  async getRendererConfig(rendererOptions: WebpackPluginRendererConfig): Promise<Configuration[]> {
    const entryPointsForTarget = {
      web: [] as (WebpackPluginEntryPointLocalWindow | WebpackPluginEntryPoint)[],
      electronRenderer: [] as (WebpackPluginEntryPointLocalWindow | WebpackPluginEntryPoint)[],
      electronPreload: [] as WebpackPluginEntryPointPreloadOnly[],
      sandboxedPreload: [] as WebpackPluginEntryPointPreloadOnly[],
    };

    for (const entry of rendererOptions.entryPoints) {
      const target = entry.nodeIntegration ?? rendererOptions.nodeIntegration ? 'electronRenderer' : 'web';
      const preloadTarget = entry.nodeIntegration ?? rendererOptions.nodeIntegration ? 'electronPreload' : 'sandboxedPreload';

      if (isPreloadOnly(entry)) {
        entryPointsForTarget[preloadTarget].push(entry);
      } else {
        entryPointsForTarget[target].push(entry);
        if (isLocalWindow(entry) && entry.preload) {
          entryPointsForTarget[preloadTarget].push({ ...entry, preload: entry.preload });
        }
      }
    }

    const rendererConfigs = await Promise.all(
      [
        await this.buildRendererConfigs(rendererOptions, entryPointsForTarget.web, RendererTarget.Web),
        await this.buildRendererConfigs(rendererOptions, entryPointsForTarget.electronRenderer, RendererTarget.ElectronRenderer),
        await this.buildRendererConfigs(rendererOptions, entryPointsForTarget.electronPreload, RendererTarget.ElectronPreload),
        await this.buildRendererConfigs(rendererOptions, entryPointsForTarget.sandboxedPreload, RendererTarget.SandboxedPreload),
      ].reduce((configs, allConfigs) => allConfigs.concat(configs))
    );

    return rendererConfigs.filter(isNotNull);
  }

  buildRendererBaseConfig(target: RendererTarget): webpack.Configuration {
    return {
      target: rendererTargetToWebpackTarget(target),
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
      plugins: [new AssetRelocatorPatch(this.isProd, target === RendererTarget.ElectronRenderer || target === RendererTarget.ElectronPreload)],
    };
  }

  async buildRendererConfigForWebOrRendererTarget(
    rendererOptions: WebpackPluginRendererConfig,
    entryPoints: WebpackPluginEntryPoint[],
    target: RendererTarget.Web | RendererTarget.ElectronRenderer
  ): Promise<Configuration | null> {
    if (!isLocalOrNoWindowEntries(entryPoints)) {
      throw new Error('Invalid renderer entry point detected.');
    }

    const entry: webpack.Entry = {};
    const baseConfig: webpack.Configuration = this.buildRendererBaseConfig(target);
    const rendererConfig = await this.resolveConfig(rendererOptions.config);

    const output = {
      path: path.resolve(this.webpackDir, 'renderer'),
      filename: '[name]/index.js',
      globalObject: 'self',
      ...(this.isProd ? {} : { publicPath: '/' }),
    };
    const plugins: webpack.WebpackPluginInstance[] = [];

    for (const entryPoint of entryPoints) {
      entry[entryPoint.name] = (entryPoint.prefixedEntries || []).concat([entryPoint.js]);

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
    return webpackMerge(baseConfig, rendererConfig || {}, { entry, output, plugins });
  }

  async buildRendererConfigForPreloadOrSandboxedPreloadTarget(
    rendererOptions: WebpackPluginRendererConfig,
    entryPoints: WebpackPluginEntryPointPreloadOnly[],
    target: RendererTarget.ElectronPreload | RendererTarget.SandboxedPreload
  ): Promise<Configuration | null> {
    if (entryPoints.length === 0) {
      return null;
    }

    const externals = ['electron', 'electron/renderer', 'electron/common', 'events', 'timers', 'url'];

    const entry: webpack.Entry = {};
    const baseConfig: webpack.Configuration = this.buildRendererBaseConfig(target);
    const rendererConfig = await this.resolveConfig(entryPoints[0].preload?.config || rendererOptions.config);

    for (const entryPoint of entryPoints) {
      entry[entryPoint.name] = (entryPoint.prefixedEntries || []).concat([entryPoint.preload.js]);
    }
    const config: Configuration = {
      target: rendererTargetToWebpackTarget(target),
      entry,
      output: {
        path: path.resolve(this.webpackDir, 'renderer'),
        filename: '[name]/preload.js',
        globalObject: 'self',
        ...(this.isProd ? { publicPath: '' } : { publicPath: '/' }),
      },
      plugins: target === RendererTarget.ElectronPreload ? [] : [new webpack.ExternalsPlugin('commonjs2', externals)],
    };
    return webpackMerge(baseConfig, rendererConfig || {}, config);
  }

  async buildRendererConfigs(
    rendererOptions: WebpackPluginRendererConfig,
    entryPoints: WebpackPluginEntryPoint[],
    target: RendererTarget
  ): Promise<Promise<webpack.Configuration | null>[]> {
    if (entryPoints.length === 0) {
      return [];
    }
    const rendererConfigs = [];
    if (target === RendererTarget.Web || target === RendererTarget.ElectronRenderer) {
      rendererConfigs.push(this.buildRendererConfigForWebOrRendererTarget(rendererOptions, entryPoints, target));
      return rendererConfigs;
    } else if (target === RendererTarget.ElectronPreload || target === RendererTarget.SandboxedPreload) {
      if (!isPreloadOnlyEntries(entryPoints)) {
        throw new Error('Invalid renderer entry point detected.');
      }

      const entryPointsWithPreloadConfig: WebpackPluginEntryPointPreloadOnly[] = [],
        entryPointsWithoutPreloadConfig: WebpackPluginEntryPointPreloadOnly[] = [];
      entryPoints.forEach((entryPoint) => (entryPoint.preload.config ? entryPointsWithPreloadConfig : entryPointsWithoutPreloadConfig).push(entryPoint));

      rendererConfigs.push(this.buildRendererConfigForPreloadOrSandboxedPreloadTarget(rendererOptions, entryPointsWithoutPreloadConfig, target));
      entryPointsWithPreloadConfig.forEach((entryPoint) => {
        rendererConfigs.push(this.buildRendererConfigForPreloadOrSandboxedPreloadTarget(rendererOptions, [entryPoint], target));
      });
      return rendererConfigs;
    } else {
      throw new Error('Invalid renderer entry point detected.');
    }
  }
}
