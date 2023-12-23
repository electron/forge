import path from 'path';

import { Configuration, DefinePlugin, Entry, ExternalsPlugin, Mode, RspackPluginInstance } from '@rspack/core';
import debug from 'debug';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { merge } from 'webpack-merge';

import {
  RspackConfigurationFactory,
  RspackPluginConfig,
  RspackPluginEntryPoint,
  RspackPluginEntryPointLocalWindow,
  RspackPluginEntryPointPreloadOnly,
  RspackPluginRendererConfig,
} from './Config';
import AssetRelocatorPatch from './utils/AssetRelocatorPath';
import processConfig from './utils/processConfig';
import { isLocalOrNoWindowEntries, isLocalWindow, isNoWindow, isPreloadOnly, isPreloadOnlyEntries } from './utils/rendererTypeUtils';

const d = debug('electron-forge:plugin:rspack:rspackconfig');

type EntryType = string | string[] | Record<string, string | string[]>;

enum RendererTarget {
  Web,
  ElectronRenderer,
  ElectronPreload,
  SandboxedPreload,
}

enum RspackTarget {
  Web = 'web',
  ElectronPreload = 'electron-preload',
  ElectronRenderer = 'electron-renderer',
}

const isNotNull = <T>(item: T | null): item is T => item !== null;

const rendererTargetToRspackTarget = (target: RendererTarget): RspackTarget => {
  switch (target) {
    case RendererTarget.Web:
    case RendererTarget.SandboxedPreload:
      return RspackTarget.Web;
    case RendererTarget.ElectronPreload:
      return RspackTarget.ElectronPreload;
    case RendererTarget.ElectronRenderer:
      return RspackTarget.ElectronRenderer;
  }
};

export default class RspackConfigGenerator {
  private isProd: boolean;
  private pluginConfig: RspackPluginConfig;
  private port: number;
  private projectDir: string;
  private rspackDir: string;

  constructor(pluginConfig: RspackPluginConfig, projectDir: string, isProd: boolean, port: number) {
    this.pluginConfig = pluginConfig;
    this.projectDir = projectDir;
    this.rspackDir = path.resolve(projectDir, 'dist');
    this.isProd = isProd;
    this.port = port;

    d('Config mode:', this.mode);
  }

  get mode(): Mode {
    return this.isProd ? 'production' : 'development';
  }

  get rendererSourceMapOption(): Configuration['devtool'] {
    return this.isProd ? 'source-map' : 'eval-source-map';
  }

  private get allPluginRendererOptions() {
    return Array.isArray(this.pluginConfig.renderer) ? this.pluginConfig.renderer : [this.pluginConfig.renderer];
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

    return merge(
      {
        devtool: 'source-map',
        target: 'electron-main',
        mode: this.mode,
        output: {
          path: path.resolve(this.rspackDir, 'main'),
          filename: 'index.js',
          libraryTarget: 'commonjs2',
        },
        plugins: [new DefinePlugin(this.getDefines())],
        node: {
          __dirname: false,
          __filename: false,
        },
      },
      mainConfig || {}
    );
  }

  async getRendererConfig(rendererOptions: RspackPluginRendererConfig): Promise<Configuration[]> {
    const entryPointsForTarget = {
      web: [] as (RspackPluginEntryPointLocalWindow | RspackPluginEntryPoint)[],
      electronRenderer: [] as (RspackPluginEntryPointLocalWindow | RspackPluginEntryPoint)[],
      electronPreload: [] as RspackPluginEntryPointPreloadOnly[],
      sandboxedPreload: [] as RspackPluginEntryPointPreloadOnly[],
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
      ].reduce((configs, allConfigs) => allConfigs.concat(configs), [])
    );

    return rendererConfigs.filter(isNotNull);
  }

  async buildRendererConfigs(
    rendererOptions: RspackPluginRendererConfig,
    entryPoints: RspackPluginEntryPoint[],
    target: RendererTarget
  ): Promise<Promise<Configuration | null>[]> {
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

      const entryPointsWithPreloadConfig: RspackPluginEntryPointPreloadOnly[] = [];
      const entryPointsWithoutPreloadConfig: RspackPluginEntryPointPreloadOnly[] = [];
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

  private async buildRendererConfigForPreloadOrSandboxedPreloadTarget(
    rendererOptions: RspackPluginRendererConfig,
    entryPoints: RspackPluginEntryPointPreloadOnly[],
    target: RendererTarget.ElectronPreload | RendererTarget.SandboxedPreload
  ): Promise<Configuration | null> {
    if (entryPoints.length === 0) {
      return null;
    }

    const externals = ['electron', 'electron/renderer', 'electron/common', 'events', 'timers', 'url'];

    const entry: Entry = {};
    const baseConfig: Configuration = this.buildRendererBaseConfig(target);
    const rendererConfig = await this.resolveConfig(entryPoints[0].preload?.config || rendererOptions.config);

    for (const entryPoint of entryPoints) {
      entry[entryPoint.name] = (entryPoint.prefixedEntries || []).concat([entryPoint.preload.js]);
    }

    const config: Configuration = {
      target: rendererTargetToRspackTarget(target),
      entry,
      output: {
        path: path.resolve(this.rspackDir, 'renderer'),
        filename: '[name]/preload.js',
        globalObject: 'self',
        ...(this.isProd ? { publicPath: '' } : { publicPath: '/' }),
      },
      plugins: target === RendererTarget.ElectronPreload ? [] : [new ExternalsPlugin('commonjs2', externals)],
    };

    return merge(baseConfig, rendererConfig || {}, config);
  }

  private async buildRendererConfigForWebOrRendererTarget(
    rendererOptions: RspackPluginRendererConfig,
    entryPoints: RspackPluginEntryPoint[],
    target: RendererTarget.Web | RendererTarget.ElectronRenderer
  ): Promise<Configuration | null> {
    if (!isLocalOrNoWindowEntries(entryPoints)) {
      throw new Error('Invalid renderer entry point detected.');
    }

    const entry: Entry = {};
    const baseConfig: Configuration = this.buildRendererBaseConfig(target);
    const rendererConfig = await this.resolveConfig(rendererOptions.config);

    const output = {
      path: path.resolve(this.rspackDir, 'renderer'),
      filename: '[name]/index.js',
      globalObject: 'self',
      ...(this.isProd ? {} : { publicPath: '/' }),
    };

    const plugins: RspackPluginInstance[] = [];
    for (const entryPoint of entryPoints) {
      entry[entryPoint.name] = (entryPoint.prefixedEntries || []).concat([entryPoint.js]);

      if (isLocalWindow(entryPoint)) {
        plugins.push(
          new HtmlWebpackPlugin({
            title: entryPoint.name,
            template: entryPoint.html,
            filename: `${entryPoint.name}/index.html`,
            chunks: [entryPoint.name].concat(entryPoint.additionalChunks || []),
          }) as unknown as RspackPluginInstance
        );
      }
    }

    return merge(baseConfig, rendererConfig || {}, { entry, output, plugins });
  }

  private buildRendererBaseConfig(target: RendererTarget): Configuration {
    return {
      target: rendererTargetToRspackTarget(target),
      devtool: this.rendererSourceMapOption,
      mode: this.mode,
      output: {
        path: path.resolve(this.rspackDir, 'renderer'),
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

  // Users can override this method in a subclass to provide custom logic or
  // configuration parameters.
  preprocessConfig = async (config: RspackConfigurationFactory): Promise<Configuration> =>
    config(
      {},
      {
        mode: this.mode,
      }
    ) as Configuration;
  private async resolveConfig(config: Configuration | RspackConfigurationFactory | string): Promise<Configuration> {
    type MaybeESM<T> = T | { default: T };

    let rawConfig =
      typeof config === 'string'
        ? // eslint-disable-next-line @typescript-eslint/no-var-requires
          (require(path.resolve(this.projectDir, config)) as MaybeESM<Configuration | RspackConfigurationFactory>)
        : config;

    if (rawConfig && typeof rawConfig === 'object' && 'default' in rawConfig) {
      rawConfig = rawConfig.default;
    }

    return processConfig(this.preprocessConfig, rawConfig);
  }

  private rendererEntryPoint(entryPoint: RspackPluginEntryPoint, basename: string): string {
    if (this.isProd) {
      return `\`file://$\{require('path').resolve(__dirname, '..', 'renderer', '${entryPoint.name}', '${basename}')}\``;
    }
    const baseUrl = `http://localhost:${this.port}/${entryPoint.name}`;
    if (basename !== 'index.html') {
      return `'${baseUrl}/${basename}'`;
    }
    return `'${baseUrl}'`;
  }

  private toEnvironmentVariable(entryPoint: RspackPluginEntryPoint, preload = false): string {
    const suffix = preload ? '_PRELOAD_RSPACK_ENTRY' : '_RSPACK_ENTRY';
    return `${entryPoint.name.toUpperCase().replace(/ /g, '_')}${suffix}`;
  }

  private getPreloadDefine(entryPoint: RspackPluginEntryPoint): string {
    if (!isNoWindow(entryPoint)) {
      if (this.isProd) {
        return `require('path').resolve(__dirname, '../renderer', '${entryPoint.name}', 'preload.js')`;
      }
      return `'${path.resolve(this.rspackDir, 'renderer', entryPoint.name, 'preload.js').replace(/\\/g, '\\\\')}'`;
    } else {
      // If this entry-point has no configured preload script just map this constant to `undefined`
      // so that any code using it still works.  This makes quick-start / docs simpler.
      return 'undefined';
    }
  }

  private getDefines(): Record<string, string> {
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
}
