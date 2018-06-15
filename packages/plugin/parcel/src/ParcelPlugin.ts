import { asyncOra } from '@electron-forge/async-ora';
import BundlerBasePlugin, { BundlerWatchWrapper } from '@electron-forge/plugin-bundler-base';
import Logger from '@electron-forge/web-multi-logger';
import Tab from '@electron-forge/web-multi-logger/dist/Tab';
import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';
import express from 'express';
import http from 'http';

import Bundler, { BundlerOptions } from 'parcel-bundler';

import { ParcelPluginConfig } from './Config';

const d = debug('electron-forge:plugin:webpack');
const BASE_PORT = 3000;

export default class ParcelPlugin extends BundlerBasePlugin<ParcelPluginConfig, BundlerOptions, any> {
  name = 'webpack';

  getDefines = (upOneMore = false) => {
    const defines: { [key: string]: {
      htmlPath: string;
      preloadPath?: string;
    }; } = {};
    if (!this.config.renderer.entries || !Array.isArray(this.config.renderer.entries)) {
      throw new Error('Required config option "renderer.entries" has not been defined');
    }
    for (const entry of this.config.renderer.entries) {
      defines[entry.name] = {
        htmlPath: this.isProd
          ? `\`file://\$\{require('path').resolve(__dirname, '../../../renderer', '${entry.name}', 'index.html')\}\``
          : `http://localhost:${BASE_PORT}/${entry.name}`,
      };

      if (entry.preload) {
        defines[entry.name].preloadPath =
          this.isProd
          ? `\`file://\$\{require('path').resolve(__dirname, '../../../renderer', '${entry.name}', 'preload.js')\}\``
          : `${path.resolve(this.baseDir, 'renderer', entry.name, 'preload.js')}`;
      }
    }
    return defines;
  }

  injectDefinesModule = async () => {
    const dir = path.resolve(this.baseDir, '..', 'node_modules', '@electron-forge/parcel-paths');
    if (await fs.pathExists(dir)) {
      await fs.remove(dir);
    }
    await fs.mkdirp(dir);
    await fs.writeJson(path.resolve(dir, 'package.json'), {
      name: '@electron-forge/parcel-paths',
      license: 'MIT',
      main: './index.js',
    });
    await fs.writeFile(path.resolve(dir, 'index.js'), `
module.exports = ${JSON.stringify(this.getDefines(), null, 2).replace(/"`/g, '`').replace(/`"/, '`')};
    `);
  }

  compileMain = async (watch = false, logger?: Logger) => {
    await this.injectDefinesModule();

    let tab: Tab;
    if (logger) {
      tab = logger.createTab('Main Process');
    }
    await asyncOra('Compiling Main Process Code', async () => {
      // TODO: Override logging
      const bundler = new Bundler(this.config.main, {
        watch,
        outDir: this.baseDir,
        outFile: 'index.js',
        target: 'electron',
        minify: this.isProd,
        sourceMaps: !this.isProd,
        detailedReport: !this.isProd,
      });
      if (watch) {
        this.watchers.push(
          new BundlerWatchWrapper(
            bundler,
            b => b.stop(),
          ),
        );
      }
      await bundler.bundle();
    });
  }

  compileRenderers = async () => {
    await this.injectDefinesModule();

    for (const entry of this.config.renderer.entries) {
      await asyncOra(`Compiling Renderer: ${entry.name}`, async () => {
        const bundler = new Bundler(entry.html, {
          watch: false,
          outDir: path.resolve(this.baseDir, 'renderer', entry.name),
          outFile: 'index.html',
          target: entry.hasNode ? 'electron' : 'browser',
          minify: this.isProd,
          sourceMaps: !this.isProd,
          detailedReport: !this.isProd,
        });
        await bundler.bundle();
      });

      if (entry.preload) {
        await asyncOra(`Compiling Renderer: ${entry.name}`, async () => {
          const bundler = new Bundler(entry.html, {
            watch: false,
            outDir: path.resolve(this.baseDir, 'renderer', entry.name),
            outFile: 'preload.js',
            target: 'electron',
            minify: this.isProd,
            sourceMaps: !this.isProd,
            detailedReport: !this.isProd,
          });
          await bundler.bundle();
        });
      }
    }
  }

  launchDevServers = async (logger: Logger) => {
    await this.injectDefinesModule();
    const app = express();

    await asyncOra('Launch Dev Servers', async () => {
      const tab = logger.createTab('Renderers');

      for (const entry of this.config.renderer.entries) {
        const bundler = new Bundler(entry.html, {
          watch: true,
          outDir: path.resolve(this.baseDir, 'renderer', entry.name),
          outFile: 'index.html',
          target: entry.hasNode ? 'electron' : 'browser',
          minify: this.isProd,
          sourceMaps: !this.isProd,
          detailedReport: !this.isProd,
          publicUrl: `/${entry.name}`,
        });
        bundler.bundle();
        app.use(bundler.middleware());
      }      
    });

    this.servers.push(app.listen(BASE_PORT));

    // await asyncOra('Compiling Preload Scripts', async () => {
    //   for (const entryPoint of this.config.renderer.entryPoints) {
    //     if (entryPoint.preload) {
    //       await new Promise(async (resolve, reject) => {
    //         const tab = logger.createTab(`${entryPoint.name} - Preload`);
    //         const [onceResolve, onceReject] = once(resolve, reject);
    //         const cb: webpack.ICompiler.Handler = (err, stats) => {
    //           tab.log(stats.toString({
    //             colors: true,
    //           }));

    //           if (err) return onceReject(err);
    //           onceResolve();
    //         };
    //         this.watchers.push(
    //           new BundlerWatchWrapper(
    //             webpack(await this.getPreloadRendererConfig(entryPoint, entryPoint.preload!)).watch({}, cb),
    //             (w, fn) => w.close(fn || (() => {})),
    //           ),
    //         );
    //       });
    //     }
    //   }
    // });
  }
}
