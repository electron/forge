import { asyncOra } from '@electron-forge/async-ora';
import BundlerBasePlugin, { BundlerWatchWrapper } from '@electron-forge/plugin-bundler-base';
import Logger from '@electron-forge/web-multi-logger';
import Tab from '@electron-forge/web-multi-logger/dist/Tab';
import debug from 'debug';
import fs from 'fs-extra';
import merge from 'webpack-merge';
import path from 'path';
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

export default class WebpackPlugin extends BundlerBasePlugin<WebpackPluginConfig, Configuration, webpack.Compiler.Watching> {
  name = 'webpack';

  getDefines = (upOneMore = false) => {
    const defines: { [key: string]: string; } = {};
    if (!this.config.renderer.entryPoints || !Array.isArray(this.config.renderer.entryPoints)) {
      throw new Error('Required config option "renderer.entryPoints" has not been defined');
    }
    for (const entryPoint of this.config.renderer.entryPoints) {
      if (entryPoint.html) {
        defines[`${entryPoint.name.toUpperCase().replace(/ /g, '_')}_WEBPACK_ENTRY`] =
          this.isProd
          ? `\`file://\$\{require('path').resolve(__dirname, '../renderer', '${upOneMore ? '..' : '.'}', '${entryPoint.name}', 'index.html')\}\``
          : `'http://localhost:${BASE_PORT}/${entryPoint.name}'`;
      } else {
        defines[`${entryPoint.name.toUpperCase().replace(/ /g, '_')}_WEBPACK_ENTRY`] =
          this.isProd
          ? `\`file://\$\{require('path').resolve(__dirname, '../renderer', '${upOneMore ? '..' : '.'}', '${entryPoint.name}', 'index.js')\}\``
          : `'http://localhost:${BASE_PORT}/${entryPoint.name}/index.js'`;
      }

      if (entryPoint.preload) {
        defines[`${entryPoint.name.toUpperCase().replace(/ /g, '_')}_PRELOAD_WEBPACK_ENTRY`] =
          this.isProd
          ? `\`file://\$\{require('path').resolve(__dirname, '../renderer', '${entryPoint.name}', 'preload.js')\}\``
          : `'${path.resolve(this.baseDir, 'renderer', entryPoint.name, 'preload.js')}'`;
      }
    }
    return defines;
  }

  getMainConfig = async () => {
    const mainConfig = this.resolveConfig(this.config.mainConfig);

    if (!mainConfig.entry) {
      throw new Error('Required config option "entry" has not been defined');
    }

    const defines = this.getDefines();
    return merge.smart({
      devtool: 'source-map',
      target: 'electron-main',
      mode: this.isProd ? 'production' : 'development',
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
      mode: this.isProd ? 'production' : 'development',
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

  getRendererConfig = async (entryPoints: WebpackPluginEntryPoint[]) => {
    const rendererConfig = this.resolveConfig(this.config.renderer.config);
    const entry: webpack.Entry = {};
    for (const entryPoint of entryPoints) {
      const prefixedEntries = entryPoint.prefixedEntries || [];
      entry[entryPoint.name] = prefixedEntries
        .concat([entryPoint.js])
        .concat(this.isProd || !Boolean(entryPoint.html) ? [] : ['webpack-hot-middleware/client']);
    }

    const defines = this.getDefines(true);
    return merge.smart({
      entry,
      devtool: 'inline-source-map',
      target: 'electron-renderer',
      mode: this.isProd ? 'production' : 'development',
      output: {
        path: path.resolve(this.baseDir, 'renderer'),
        filename: '[name]/index.js',
        globalObject: 'self',
      },
      node: {
        __dirname: false,
        __filename: false,
      },
      plugins: entryPoints.filter(entryPoint => Boolean(entryPoint.html)).map(entryPoint =>
        new HtmlWebpackPlugin({
          title: entryPoint.name,
          template: entryPoint.html,
          filename: `${entryPoint.name}/index.html`,
          chunks: [entryPoint.name].concat(entryPoint.additionalChunks || []),
        }),
      ).concat([new webpack.DefinePlugin(defines)]).concat(this.isProd ? [] : [new webpack.HotModuleReplacementPlugin()]),
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
          this.watchers.push(
            new BundlerWatchWrapper(
              compiler.watch({}, cb),
              (w, fn) => w.close(fn || (() => {})),
            ),
          );
        } else {
          compiler.run(cb);
        }
      });
    });
  }

  compileRenderers = async (watch = false) => {
    await asyncOra('Compiling Renderer Template', async () => {
      await new Promise(async (resolve, reject) => {
        webpack(await this.getRendererConfig(this.config.renderer.entryPoints)).run((err, stats) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    for (const entryPoint of this.config.renderer.entryPoints) {
      if (entryPoint.preload) {
        await asyncOra(`Compiling Renderer Preload: ${entryPoint.name}`, async () => {
          await new Promise(async (resolve, reject) => {
            webpack(await this.getPreloadRendererConfig(entryPoint, entryPoint.preload!)).run((err, stats) => {
              if (err) return reject(err);
              resolve();
            });
          });
        });
      }
    }
  }

  launchDevServers = async (logger: Logger) => {
    await asyncOra('Launch Dev Servers', async () => {
      const tab = logger.createTab('Renderers');

      const config = await this.getRendererConfig(this.config.renderer.entryPoints);
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
      this.servers.push(app.listen(BASE_PORT));
    });

    await asyncOra('Compiling Preload Scripts', async () => {
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
            this.watchers.push(
              new BundlerWatchWrapper(
                webpack(await this.getPreloadRendererConfig(entryPoint, entryPoint.preload!)).watch({}, cb),
                (w, fn) => w.close(fn || (() => {})),
              ),
            );
          });
        }
      }
    });
  }
}
