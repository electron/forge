import { asyncOra } from '@electron-forge/async-ora';
import PluginBase from '@electron-forge/plugin-base';
import fs from 'fs-extra';
import merge from 'webpack-merge';
import path from 'path';
import { spawnPromise } from 'spawn-rx';
import webpack, { Configuration } from 'webpack';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpackDevMiddleware from 'webpack-dev-middleware';
import express from 'express';

import HtmlWebpackPlugin, { Config } from 'html-webpack-plugin';

import { WebpackPluginConfig, WebpackPluginEntryPoint } from './Config';

const BASE_PORT = 3000;

export default class WebpackPlugin extends PluginBase<WebpackPluginConfig> {
  name = 'webpack';
  private isProd = false;
  private baseDir!: string;

  constructor(c: WebpackPluginConfig) {
    super(c);

    this.startLogic = this.startLogic.bind(this);
    this.getHook = this.getHook.bind(this);
  }

  private resolveConfig = (config: Configuration | string) => {
    if (typeof config === 'string') return require(path.resolve(path.dirname(this.baseDir), config)) as Configuration;
    return config;
  }

  init = (dir: string) => {
    this.baseDir = path.resolve(dir, '.webpack');
  }

  getHook(name: string) {
    switch (name) {
      case 'prePackage':
        this.isProd = true;
        return async () => {
          await this.compileMain();
          await this.compileRenderers();
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
    for (const entryPoint of this.config.renderer.entryPoints) {
      defines[`${entryPoint.name.toUpperCase().replace(/ /g, '_')}_WEBPACK_ENTRY`] =
        this.isProd
        ? `\`file://\$\{require('path').resolve(__dirname, '../renderer', '${entryPoint.name}', 'index.html')\}\``
        : `'http://localhost:${BASE_PORT + index}'`;
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
    }, mainConfig || {});
  }

  getRendererConfig = async (entryPoint: WebpackPluginEntryPoint) => {
    const rendererConfig = this.resolveConfig(this.config.renderer.config);
    const prefixedEntries = this.config.renderer.prefixedEntries || [];
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

  compileMain = async () => {
    await asyncOra('Compiling Main Process Code', async () => {
      await new Promise(async (resolve, reject) => {
        webpack(await this.getMainConfig()).run((err, stats) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  compileRenderers = async () => {
    for (const entryPoint of this.config.renderer.entryPoints) {
      await asyncOra(`Compiling Renderer Template: ${entryPoint.name}`, async () => {
        await new Promise(async (resolve, reject) => {
          webpack(await this.getRendererConfig(entryPoint)).run((err, stats) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
    }
  }

  launchDevServers = async () => {
    await asyncOra('Launch Dev Servers', async () => {
      let index = 0;
      for (const entryPoint of this.config.renderer.entryPoints) {
        const config = await this.getRendererConfig(entryPoint);
        const compiler = webpack(config);
        const server = webpackDevMiddleware(compiler, {
          logLevel: 'silent',
          publicPath: '/',
          hot: true,
          historyApiFallback: true,
        } as any);
        const app = express();
        app.use(server);
        app.use(webpackHotMiddleware(compiler));
        app.listen(BASE_PORT + index);
        index += 1;
      }
    });
  }

  async startLogic(): Promise<false> {
    await this.compileMain();
    await this.launchDevServers();
    return false;
  }
}
