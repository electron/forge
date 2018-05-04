import { asyncOra } from '@electron-forge/async-ora';
import PluginBase from '@electron-forge/plugin-base';
import Logger from '@electron-forge/web-multi-logger';
import Tab from '@electron-forge/web-multi-logger/dist/Tab';
import { ChildProcess } from 'child_process';
import debug from 'debug';
import fs from 'fs-extra';
import merge from 'webpack-merge';
import path from 'path';
import { spawnPromise } from 'spawn-rx';
import webpack, { Configuration } from 'webpack';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpackDevMiddleware from 'webpack-dev-middleware';
import express from 'express';
import http from 'http';

import HtmlWebpackPlugin, { Config } from 'html-webpack-plugin';

import once from './util/once';
import { WebpackPluginConfig, WebpackPluginEntryPoint, WebpackPreloadEntryPoint } from './Config';

const d = debug('electron-forge:plugin:webpack');
const BASE_PORT = 3000;

export default class WebpackPlugin extends PluginBase<WebpackPluginConfig> {
  name = 'webpack';
  private isProd = false;
  private baseDir!: string;
  private watchers: webpack.Compiler.Watching[] = [];
  private servers: http.Server[] = [];
  private loggers: Logger[] = [];

  constructor(c: WebpackPluginConfig) {
    super(c);

    this.startLogic = this.startLogic.bind(this);
    this.getHook = this.getHook.bind(this);
  }

  private resolveConfig = (config: Configuration | string) => {
    if (typeof config === 'string') return require(path.resolve(path.dirname(this.baseDir), config)) as Configuration;
    return config;
  }

  private exitHandler = (options: { cleanup?: boolean; exit?: boolean }, err?: Error) => {
    d('handling process exit with:', options);
    if (options.cleanup) {
      for (const watcher of this.watchers) {
        d('cleaning webpack watcher');
        watcher.close(() => {});
      }
      this.watchers = [];
      for (const server of this.servers) {
        d('cleaning http server');
        server.close();
      }
      this.servers = [];
      for (const logger of this.loggers) {
        d('stopping logger');
        logger.stop();
      }
      this.loggers = [];
    }
    if (err) console.error(err.stack);
    if (options.exit) process.exit();
  }

  init = (dir: string) => {
    this.baseDir = path.resolve(dir, '.webpack');

    d('hooking process events');
    process.on('exit', this.exitHandler.bind(this, { cleanup: true }));
    process.on('SIGINT', this.exitHandler.bind(this, { exit: true }));
  }

  getHook(name: string) {
    switch (name) {
      case 'prePackage':
        this.isProd = true;
        return async () => {
          await this.compileMain();
          await this.compileRenderers();
        };
      case 'postStart':
        return async (_: any, child: ChildProcess) => {
          console.log(child);
          console.log(Object.keys(child));
          d('hooking electron process exit');
          child.on('exit', () => this.exitHandler({ cleanup: true, exit: true }));
        };
    }
    return null;
  }

  getMainConfig = async () => {
    const mainConfig = this.resolveConfig(this.config.mainConfig);

    if (!mainConfig.entry) {
      throw new Error('Required config option "entry" has not been defined');
    }

    const defines: { [key: string]: string; } = {};
    let index = 0;
    if (!this.config.renderer.entryPoints || !Array.isArray(this.config.renderer.entryPoints)) {
      throw new Error('Required config option "renderer.entryPoints" has not been defined');
    }
    for (const entryPoint of this.config.renderer.entryPoints) {
      defines[`${entryPoint.name.toUpperCase().replace(/ /g, '_')}_WEBPACK_ENTRY`] =
        this.isProd
        ? `\`file://\$\{require('path').resolve(__dirname, '../renderer', '${entryPoint.name}', 'index.html')\}\``
        : `'http://localhost:${BASE_PORT + index}'`;

      if (entryPoint.preload) {
        defines[`${entryPoint.name.toUpperCase().replace(/ /g, '_')}_PRELOAD_WEBPACK_ENTRY`] =
          this.isProd
          ? `\`file://\$\{require('path').resolve(__dirname, '../renderer', '${entryPoint.name}', 'preload.js')\}\``
          : `'${path.resolve(this.baseDir, 'renderer', entryPoint.name, 'preload.js')}'`;
      }
      index += 1;
    }
    return merge.smart({
      devtool: 'source-map',
      target: 'electron-main',
      output: {
        path: path.resolve(this.baseDir, 'main'),
        filename: 'index.js',
        libraryTarget: 'commonjs2',
      },
      plugins: [
        new webpack.DefinePlugin(defines),
      ],
      node: {
        __dirname: false,
        __filename: false,
      },
      resolve: {
        modules: [
          path.resolve(path.dirname(this.baseDir), './'),
          path.resolve(path.dirname(this.baseDir), 'node_modules'),
          path.resolve(__dirname, '..', 'node_modules'),
        ],
      },
    }, mainConfig || {});
  }

  getPreloadRendererConfig = async (parentPoint: WebpackPluginEntryPoint, entryPoint: WebpackPreloadEntryPoint) => {
    const rendererConfig = this.resolveConfig(this.config.renderer.config);
    const prefixedEntries = entryPoint.prefixedEntries || [];

    return merge.smart({
      devtool: 'inline-source-map',
      target: 'electron-renderer',
      entry: prefixedEntries.concat([
        entryPoint.js,
      ]),
      output: {
        path: path.resolve(this.baseDir, 'renderer', parentPoint.name),
        filename: 'preload.js',
      },
      node: {
        __dirname: false,
        __filename: false,
      },
    }, rendererConfig);
  }

  getRendererConfig = async (entryPoint: WebpackPluginEntryPoint) => {
    const rendererConfig = this.resolveConfig(this.config.renderer.config);
    const prefixedEntries = entryPoint.prefixedEntries || [];
    return merge.smart({
      devtool: 'inline-source-map',
      target: 'electron-renderer',
      entry: prefixedEntries.concat([
        entryPoint.js,
      ]).concat(this.isProd ? [] : ['webpack-hot-middleware/client']),
      output: {
        path: path.resolve(this.baseDir, 'renderer', entryPoint.name),
        filename: 'index.js',
      },
      node: {
        __dirname: false,
        __filename: false,
      },
      plugins: [
        new HtmlWebpackPlugin({
          title: entryPoint.name,
          template: entryPoint.html,
        }),
      ].concat(this.isProd ? [] : [new webpack.HotModuleReplacementPlugin()]),
    }, rendererConfig);
  }

  compileMain = async (watch = false, logger?: Logger) => {
    let tab: Tab;
    if (logger) {
      tab = logger.createTab('Main Process');
    }
    await asyncOra('Compiling Main Process Code', async () => {
      await new Promise(async (resolve, reject) => {
        const compiler = webpack(await this.getMainConfig());
        const [onceResolve, onceReject] = once(resolve, reject);
        const cb: webpack.ICompiler.Handler = (err, stats) => {
          if (tab) {
            tab.log(stats.toString({
              colors: true,
            }));
          }

          if (err) return onceReject(err);
          onceResolve();
        };
        if (watch) {
          this.watchers.push(compiler.watch({}, cb));
        } else {
          compiler.run(cb);
        }
      });
    });
  }

  compileRenderers = async (watch = false) => {
    for (const entryPoint of this.config.renderer.entryPoints) {
      await asyncOra(`Compiling Renderer Template: ${entryPoint.name}`, async () => {
        await new Promise(async (resolve, reject) => {
          webpack(await this.getRendererConfig(entryPoint)).run((err, stats) => {
            if (err) return reject(err);
            resolve();
          });
        });
        if (entryPoint.preload) {
          await new Promise(async (resolve, reject) => {
            webpack(await this.getPreloadRendererConfig(entryPoint, entryPoint.preload!)).run((err, stats) => {
              if (err) return reject(err);
              resolve();
            });
          });
        }
      });
    }
  }

  launchDevServers = async (logger: Logger) => {
    await asyncOra('Launch Dev Servers', async () => {
      let index = 0;
      for (const entryPoint of this.config.renderer.entryPoints) {
        const tab = logger.createTab(entryPoint.name);

        const config = await this.getRendererConfig(entryPoint);
        const compiler = webpack(config);
        const server = webpackDevMiddleware(compiler, {
          logger: {
            log: tab.log.bind(tab),
            info: tab.log.bind(tab),
            error: tab.log.bind(tab),
            warn: tab.log.bind(tab),
          },
          publicPath: '/',
          hot: true,
          historyApiFallback: true,
        } as any);
        const app = express();
        app.use(server);
        app.use(webpackHotMiddleware(compiler));
        this.servers.push(app.listen(BASE_PORT + index));
        index += 1;
      }
    });

    await asyncOra('Compile Preload Scripts', async () => {
      for (const entryPoint of this.config.renderer.entryPoints) {
        if (entryPoint.preload) {
          await new Promise(async (resolve, reject) => {
            const tab = logger.createTab(`${entryPoint.name} - Preload`);
            const [onceResolve, onceReject] = once(resolve, reject);
            const cb: webpack.ICompiler.Handler = (err, stats) => {
              tab.log(stats.toString({
                colors: true,
              }));

              if (err) return onceReject(err);
              onceResolve();
            };
            this.watchers.push(webpack(await this.getPreloadRendererConfig(entryPoint, entryPoint.preload!)).watch({}, cb));
          });
        }
      }
    });
  }

  async startLogic(): Promise<false> {
    const logger = new Logger();
    this.loggers.push(logger);
    await this.compileMain(true, logger);
    await this.launchDevServers(logger);
    await logger.start();
    return false;
  }
}
