import path from 'node:path';

import {
  getAppProtocolBanner,
  getAppProtocolEntryUrl,
  resolveAppProtocolConfig,
} from '@electron-forge/core-utils';
import debug from 'debug';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import type * as webpack from 'webpack';
import webpackPkg from 'webpack';

const { BannerPlugin, DefinePlugin, ExternalsPlugin } = webpackPkg;
import { merge as webpackMerge } from 'webpack-merge';

import {
  WebpackPluginConfig,
  WebpackPluginEntryPoint,
  WebpackPluginEntryPointLocalWindow,
  WebpackPluginEntryPointPreloadOnly,
  WebpackPluginRendererConfig,
} from './Config.js';
import AssetRelocatorPatch from './util/AssetRelocatorPatch.js';
import processConfig from './util/processConfig.js';
import {
  isLocalOrNoWindowEntries,
  isLocalWindow,
  isNoWindow,
  isPreloadOnly,
  isPreloadOnlyEntries,
} from './util/rendererTypeUtils.js';
import { pathToFileURL } from 'node:url';

type EntryType = string | string[] | Record<string, string | string[]>;
type WebpackMode = 'production' | 'development';

const d = debug('electron-forge:plugin:webpack:webpackconfig');

/** @inline */
export type ConfigurationFactory = (
  env: string | Record<string, string | boolean | number> | unknown,
  args: Record<string, unknown>,
) => webpack.Configuration | Promise<webpack.Configuration>;

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

  constructor(
    pluginConfig: WebpackPluginConfig,
    projectDir: string,
    isProd: boolean,
    port: number,
  ) {
    this.pluginConfig = pluginConfig;
    this.projectDir = projectDir;
    this.webpackDir = path.resolve(projectDir, '.webpack');
    this.isProd = isProd;
    this.port = port;

    d('Config mode:', this.mode);
  }

  async resolveConfig(
    config: webpack.Configuration | ConfigurationFactory | string,
  ): Promise<webpack.Configuration> {
    type MaybeESM<T> = T | { default: T };

    let rawConfig =
      typeof config === 'string'
        ? ((await import(
            pathToFileURL(path.resolve(this.projectDir, config)).toString()
          )) as MaybeESM<webpack.Configuration | ConfigurationFactory>)
        : config;

    if (rawConfig && typeof rawConfig === 'object' && 'default' in rawConfig) {
      rawConfig = rawConfig.default;
    }

    return processConfig(this.preprocessConfig, rawConfig);
  }

  // Users can override this method in a subclass to provide custom logic or
  // configuration parameters.
  preprocessConfig = async (
    config: ConfigurationFactory,
  ): Promise<webpack.Configuration> =>
    config(
      {},
      {
        mode: this.mode,
      },
    );

  get mode(): WebpackMode {
    return this.isProd ? 'production' : 'development';
  }

  get rendererSourceMapOption(): string {
    return this.isProd ? 'source-map' : 'eval-source-map';
  }

  rendererEntryPoint(
    entryPoint: WebpackPluginEntryPoint,
    basename: string,
    nodeIntegration: boolean,
  ): string {
    if (this.isProd) {
      // With `appProtocol` enabled, HTML entry points are served over the
      // privileged `app://` scheme by the runtime injected into the main
      // bundle. JS-only (no-window) entry points keep their `file://` paths —
      // they are not window entry URLs. `nodeIntegration` entry points also
      // stay on `file://`: Electron only derives the renderer's `__dirname`
      // from `file:` page URLs, which AssetRelocatorPatch relies on for
      // relocated native modules and assets in production.
      if (
        this.pluginConfig.appProtocol &&
        basename === 'index.html' &&
        !nodeIntegration
      ) {
        const { scheme } = resolveAppProtocolConfig(
          this.pluginConfig.appProtocol,
        );
        // Every origin is rooted at the shared `.webpack/renderer/` output
        // directory (see `buildRendererBaseConfig`'s `publicPath`), so the
        // entry path carries the per-entry subdirectory.
        return `'${getAppProtocolEntryUrl(entryPoint.name, scheme, `${entryPoint.name}/index.html`)}'`;
      }
      return `\`file://$\{require('path').resolve(__dirname, '..', 'renderer', '${entryPoint.name}', '${basename}')}\``;
    }
    const protocol =
      this.pluginConfig.devServer?.server === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://localhost:${this.port}/${entryPoint.name}`;
    return `'${baseUrl}/${basename}'`;
  }

  toEnvironmentVariable(
    entryPoint: WebpackPluginEntryPoint,
    preload = false,
  ): string {
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
    return Array.isArray(this.pluginConfig.renderer)
      ? this.pluginConfig.renderer
      : [this.pluginConfig.renderer];
  }

  getDefines(): Record<string, string> {
    const defines: Record<string, string> = {};

    for (const pluginRendererOptions of this.allPluginRendererOptions) {
      if (
        !pluginRendererOptions.entryPoints ||
        !Array.isArray(pluginRendererOptions.entryPoints)
      ) {
        throw new Error(
          'Required config option "renderer.entryPoints" has not been defined',
        );
      }
      for (const entryPoint of pluginRendererOptions.entryPoints) {
        const entryKey = this.toEnvironmentVariable(entryPoint);
        const nodeIntegration =
          entryPoint.nodeIntegration ??
          pluginRendererOptions.nodeIntegration ??
          false;
        if (isLocalWindow(entryPoint)) {
          defines[entryKey] = this.rendererEntryPoint(
            entryPoint,
            'index.html',
            nodeIntegration,
          );
        } else {
          defines[entryKey] = this.rendererEntryPoint(
            entryPoint,
            'index.js',
            nodeIntegration,
          );
        }
        defines[`process.env.${entryKey}`] = defines[entryKey];

        const preloadDefineKey = this.toEnvironmentVariable(entryPoint, true);
        defines[preloadDefineKey] = this.getPreloadDefine(entryPoint);
        defines[`process.env.${preloadDefineKey}`] = defines[preloadDefineKey];
      }
    }

    return defines;
  }

  async getMainConfig(): Promise<webpack.Configuration> {
    const mainConfig = await this.resolveConfig(this.pluginConfig.mainConfig);

    if (!mainConfig.entry) {
      throw new Error(
        'Required option "mainConfig.entry" has not been defined',
      );
    }
    const fix = (item: EntryType): EntryType => {
      if (typeof item === 'string') return (fix([item]) as string[])[0];
      if (Array.isArray(item)) {
        return item.map((val) =>
          val.startsWith('./') ? path.resolve(this.projectDir, val) : val,
        );
      }
      const ret: Record<string, string | string[]> = {};
      for (const key of Object.keys(item)) {
        ret[key] = fix(item[key]) as string | string[];
      }
      return ret;
    };
    mainConfig.entry = fix(mainConfig.entry as EntryType);

    // Prepend the appProtocol runtime so it runs before any user code — see
    // app-protocol.ts in @electron-forge/core-utils for the ordering
    // constraints. In development the runtime only registers the privileged
    // schemes (so they carry the same privileges as in the packaged app);
    // serving over the scheme is production-only, the dev server serves
    // renderers over HTTP. `raw` emits the code verbatim (not wrapped in a
    // comment) and `entryOnly` keeps it out of split chunks.
    const appProtocolBanner = this.pluginConfig.appProtocol
      ? getAppProtocolBanner(
          // Only entries the scheme actually serves (the same predicate
          // `rendererEntryPoint` uses): JS-only and `nodeIntegration` entries
          // keep `file://`, so their names are neither validated as URL hosts
          // nor added to the handler's origin allowlist.
          this.allPluginRendererOptions.flatMap((rendererOptions) =>
            (rendererOptions.entryPoints ?? [])
              .filter(
                (entryPoint) =>
                  isLocalWindow(entryPoint) &&
                  !(
                    entryPoint.nodeIntegration ??
                    rendererOptions.nodeIntegration ??
                    false
                  ),
              )
              .map((entryPoint) => entryPoint.name),
          ),
          this.pluginConfig.appProtocol,
          {
            serveRenderers: this.isProd,
            // All origins share the `.webpack/renderer/` root — webpack
            // emits one output directory with per-entry subdirectories
            // and `publicPath: '/'`-based asset URLs.
            rootIncludesName: false,
          },
        )
      : '';
    // The banner is empty in development with `registerSchemes: false` — the
    // call above still validates the config either way.
    const appProtocolPlugins = appProtocolBanner
      ? [
          new BannerPlugin({
            banner: appProtocolBanner,
            raw: true,
            entryOnly: true,
          }),
        ]
      : [];

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
        plugins: [new DefinePlugin(this.getDefines()), ...appProtocolPlugins],
        node: {
          __dirname: false,
          __filename: false,
        },
      },
      mainConfig || {},
    );
  }

  async getRendererConfig(
    rendererOptions: WebpackPluginRendererConfig,
  ): Promise<webpack.Configuration[]> {
    const entryPointsForTarget = {
      web: [] as (
        | WebpackPluginEntryPointLocalWindow
        | WebpackPluginEntryPoint
      )[],
      electronRenderer: [] as (
        | WebpackPluginEntryPointLocalWindow
        | WebpackPluginEntryPoint
      )[],
      electronPreload: [] as WebpackPluginEntryPointPreloadOnly[],
      sandboxedPreload: [] as WebpackPluginEntryPointPreloadOnly[],
    };

    for (const entry of rendererOptions.entryPoints) {
      const target =
        (entry.nodeIntegration ?? rendererOptions.nodeIntegration)
          ? 'electronRenderer'
          : 'web';
      const preloadTarget =
        (entry.nodeIntegration ?? rendererOptions.nodeIntegration)
          ? 'electronPreload'
          : 'sandboxedPreload';

      if (isPreloadOnly(entry)) {
        entryPointsForTarget[preloadTarget].push(entry);
      } else {
        entryPointsForTarget[target].push(entry);
        if (isLocalWindow(entry) && entry.preload) {
          entryPointsForTarget[preloadTarget].push({
            ...entry,
            preload: entry.preload,
          });
        }
      }
    }

    const rendererConfigs = await Promise.all(
      [
        await this.buildRendererConfigs(
          rendererOptions,
          entryPointsForTarget.web,
          RendererTarget.Web,
        ),
        await this.buildRendererConfigs(
          rendererOptions,
          entryPointsForTarget.electronRenderer,
          RendererTarget.ElectronRenderer,
        ),
        await this.buildRendererConfigs(
          rendererOptions,
          entryPointsForTarget.electronPreload,
          RendererTarget.ElectronPreload,
        ),
        await this.buildRendererConfigs(
          rendererOptions,
          entryPointsForTarget.sandboxedPreload,
          RendererTarget.SandboxedPreload,
        ),
      ].reduce((configs, allConfigs) => allConfigs.concat(configs)),
    );

    return rendererConfigs.filter(isNotNull);
  }

  /**
   * Renderers served over `appProtocol` need root-relative asset URLs: the
   * handler roots every origin at `.webpack/renderer/`, so `publicPath: '/'`
   * makes html-webpack-plugin emit `/<name>/index.js` instead of the `'auto'`
   * relative URLs that only resolve under `file://`. Only compilations whose
   * every entry is actually served get it — JS-only and `nodeIntegration`
   * entries stay on `file://` and rely on `'auto'` script-relative URLs, so
   * served and unserved entries are built as separate compilations.
   */
  private rendererPublicPath(servedOverAppProtocol: boolean) {
    if (!this.isProd) return { publicPath: '/' };
    return servedOverAppProtocol ? { publicPath: '/' } : {};
  }

  buildRendererBaseConfig(
    target: RendererTarget,
    servedOverAppProtocol = false,
  ): webpack.Configuration {
    return {
      target: rendererTargetToWebpackTarget(target),
      devtool: this.rendererSourceMapOption,
      mode: this.mode,
      output: {
        path: path.resolve(this.webpackDir, 'renderer'),
        filename: '[name]/index.js',
        globalObject: 'self',
        ...this.rendererPublicPath(servedOverAppProtocol),
      },
      node: {
        __dirname: false,
        __filename: false,
      },
      plugins: [
        new AssetRelocatorPatch(
          this.isProd,
          target === RendererTarget.ElectronRenderer ||
            target === RendererTarget.ElectronPreload,
        ),
      ],
    };
  }

  async buildRendererConfigForWebOrRendererTarget(
    rendererOptions: WebpackPluginRendererConfig,
    entryPoints: WebpackPluginEntryPoint[],
    target: RendererTarget.Web | RendererTarget.ElectronRenderer,
    servedOverAppProtocol = false,
  ): Promise<webpack.Configuration | null> {
    if (!isLocalOrNoWindowEntries(entryPoints)) {
      throw new Error('Invalid renderer entry point detected.');
    }

    const entry: webpack.Entry = {};
    const baseConfig: webpack.Configuration = this.buildRendererBaseConfig(
      target,
      servedOverAppProtocol,
    );
    const rendererConfig = await this.resolveConfig(rendererOptions.config);

    const output = {
      path: path.resolve(this.webpackDir, 'renderer'),
      filename: '[name]/index.js',
      globalObject: 'self',
      ...this.rendererPublicPath(servedOverAppProtocol),
    };
    const plugins: webpack.WebpackPluginInstance[] = [];

    for (const entryPoint of entryPoints) {
      entry[entryPoint.name] = (entryPoint.prefixedEntries || []).concat([
        entryPoint.js,
      ]);

      if (isLocalWindow(entryPoint)) {
        plugins.push(
          new HtmlWebpackPlugin({
            title: entryPoint.name,
            template: entryPoint.html,
            filename: `${entryPoint.name}/index.html`,
            chunks: [entryPoint.name].concat(entryPoint.additionalChunks || []),
          }) as webpack.WebpackPluginInstance,
        );
      }
    }
    return webpackMerge(baseConfig, rendererConfig || {}, {
      entry,
      output,
      plugins,
    });
  }

  async buildRendererConfigForPreloadOrSandboxedPreloadTarget(
    rendererOptions: WebpackPluginRendererConfig,
    entryPoints: WebpackPluginEntryPointPreloadOnly[],
    target: RendererTarget.ElectronPreload | RendererTarget.SandboxedPreload,
  ): Promise<webpack.Configuration | null> {
    if (entryPoints.length === 0) {
      return null;
    }

    const externals = [
      'electron',
      'electron/renderer',
      'electron/common',
      'events',
      'timers',
      'url',
    ];

    const entry: webpack.Entry = {};
    const baseConfig: webpack.Configuration =
      this.buildRendererBaseConfig(target);
    const rendererConfig = await this.resolveConfig(
      entryPoints[0].preload?.config || rendererOptions.config,
    );

    for (const entryPoint of entryPoints) {
      entry[entryPoint.name] = (entryPoint.prefixedEntries || []).concat([
        entryPoint.preload.js,
      ]);
    }
    const config: webpack.Configuration = {
      target: rendererTargetToWebpackTarget(target),
      entry,
      output: {
        path: path.resolve(this.webpackDir, 'renderer'),
        filename: '[name]/preload.js',
        globalObject: 'self',
        ...(this.isProd ? { publicPath: '' } : { publicPath: '/' }),
      },
      plugins:
        target === RendererTarget.ElectronPreload
          ? []
          : [new ExternalsPlugin('commonjs2', externals)],
    };
    return webpackMerge(baseConfig, rendererConfig || {}, config);
  }

  async buildRendererConfigs(
    rendererOptions: WebpackPluginRendererConfig,
    entryPoints: WebpackPluginEntryPoint[],
    target: RendererTarget,
  ): Promise<Promise<webpack.Configuration | null>[]> {
    if (entryPoints.length === 0) {
      return [];
    }
    const rendererConfigs = [];
    if (
      target === RendererTarget.Web ||
      target === RendererTarget.ElectronRenderer
    ) {
      // With `appProtocol`, only local-window Web-target entries are served
      // over the scheme; JS-only entries keep `file://` URLs and `'auto'`
      // script-relative asset resolution. The two need different prod
      // `publicPath` values, so they build as separate compilations.
      const splitServedEntries =
        this.isProd &&
        !!this.pluginConfig.appProtocol &&
        target === RendererTarget.Web;
      const served = splitServedEntries
        ? entryPoints.filter((entryPoint) => isLocalWindow(entryPoint))
        : [];
      const unserved = splitServedEntries
        ? entryPoints.filter((entryPoint) => !isLocalWindow(entryPoint))
        : entryPoints;
      if (served.length > 0) {
        rendererConfigs.push(
          this.buildRendererConfigForWebOrRendererTarget(
            rendererOptions,
            served,
            target,
            true,
          ),
        );
      }
      if (unserved.length > 0) {
        rendererConfigs.push(
          this.buildRendererConfigForWebOrRendererTarget(
            rendererOptions,
            unserved,
            target,
          ),
        );
      }
      return rendererConfigs;
    } else if (
      target === RendererTarget.ElectronPreload ||
      target === RendererTarget.SandboxedPreload
    ) {
      if (!isPreloadOnlyEntries(entryPoints)) {
        throw new Error('Invalid renderer entry point detected.');
      }

      const entryPointsWithPreloadConfig: WebpackPluginEntryPointPreloadOnly[] =
          [],
        entryPointsWithoutPreloadConfig: WebpackPluginEntryPointPreloadOnly[] =
          [];
      entryPoints.forEach((entryPoint) =>
        (entryPoint.preload.config
          ? entryPointsWithPreloadConfig
          : entryPointsWithoutPreloadConfig
        ).push(entryPoint),
      );

      rendererConfigs.push(
        this.buildRendererConfigForPreloadOrSandboxedPreloadTarget(
          rendererOptions,
          entryPointsWithoutPreloadConfig,
          target,
        ),
      );
      entryPointsWithPreloadConfig.forEach((entryPoint) => {
        rendererConfigs.push(
          this.buildRendererConfigForPreloadOrSandboxedPreloadTarget(
            rendererOptions,
            [entryPoint],
            target,
          ),
        );
      });
      return rendererConfigs;
    } else {
      throw new Error('Invalid renderer entry point detected.');
    }
  }
}
