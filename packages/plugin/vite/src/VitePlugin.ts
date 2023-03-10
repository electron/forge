import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
import { ForgeMultiHookMap, StartResult } from '@electron-forge/shared-types';
import debug from 'debug';
// eslint-disable-next-line node/no-extraneous-import
import { RollupWatcher } from 'rollup';
import { default as vite } from 'vite';

import { VitePluginConfig } from './Config';
import ViteConfigGenerator from './ViteConfig';

const d = debug('electron-forge:plugin:vite');

export default class VitePlugin extends PluginBase<VitePluginConfig> {
  private static alreadyStarted = false;

  public name = 'vite';

  private isProd = false;

  // The root of the Electron app
  private projectDir!: string;

  // Where the Vite output is generated. Usually `${projectDir}/.vite`
  private baseDir!: string;

  private configGeneratorCache!: ViteConfigGenerator;

  private watchers: RollupWatcher[] = [];

  private servers: http.Server[] = [];

  init = (dir: string): void => {
    this.setDirectories(dir);

    d('hooking process events');
    process.on('exit', (_code) => this.exitHandler({ cleanup: true }));
    process.on('SIGINT' as NodeJS.Signals, (_signal) => this.exitHandler({ exit: true }));
  };

  private setDirectories(dir: string): void {
    this.projectDir = dir;
    this.baseDir = path.join(dir, '.vite');
  }

  private get configGenerator(): ViteConfigGenerator {
    return (this.configGeneratorCache ??= new ViteConfigGenerator(this.config, this.projectDir, this.isProd));
  }

  getHooks = (): ForgeMultiHookMap => {
    return {
      prePackage: [
        namedHookWithTaskFn<'prePackage'>(async () => {
          this.isProd = true;
          await fs.rm(this.baseDir, { recursive: true, force: true });

          await Promise.all([this.build(), this.buildRenderer()]);
        }, 'Building vite bundles'),
      ],
    };
  };

  startLogic = async (): Promise<StartResult> => {
    if (VitePlugin.alreadyStarted) return false;
    VitePlugin.alreadyStarted = true;

    await fs.rm(this.baseDir, { recursive: true, force: true });

    return {
      tasks: [
        {
          title: 'Compiling main process code',
          task: async () => {
            await this.build(true);
          },
          options: {
            showTimer: true,
          },
        },
        {
          title: 'Launching dev servers for renderer process code',
          task: async () => {
            await this.launchRendererDevServers();
          },
          options: {
            persistentOutput: true,
            showTimer: true,
          },
        },
      ],
      result: false,
    };
  };

  // Main process, Preload scripts and Worker process, etc.
  build = async (watch = false): Promise<void> => {
    for (const userConfig of await this.configGenerator.getBuildConfig(watch)) {
      const buildResult = await vite.build({
        // Avoid recursive builds caused by users configuring @electron-forge/plugin-vite in Vite config file.
        configFile: false,
        ...userConfig,
      });

      if (Object.keys(buildResult).includes('close')) {
        this.watchers.push(buildResult as RollupWatcher);
      }
    }
  };

  // Renderer process
  buildRenderer = async (): Promise<void> => {
    for (const userConfig of await this.configGenerator.getRendererConfig()) {
      await vite.build({
        configFile: false,
        ...userConfig,
      });
    }
  };

  launchRendererDevServers = async (): Promise<void> => {
    for (const userConfig of await this.configGenerator.getRendererConfig()) {
      const viteDevServer = await vite.createServer({
        configFile: false,
        ...userConfig,
      });

      await viteDevServer.listen();
      viteDevServer.printUrls();

      if (viteDevServer.httpServer) {
        this.servers.push(viteDevServer.httpServer);
      }
    }
  };

  exitHandler = (options: { cleanup?: boolean; exit?: boolean }, err?: Error): void => {
    d('handling process exit with:', options);
    if (options.cleanup) {
      for (const watcher of this.watchers) {
        d('cleaning vite watcher');
        watcher.close();
      }
      this.watchers = [];

      for (const server of this.servers) {
        d('cleaning http server');
        server.close();
      }
      this.servers = [];
    }
    if (err) console.error(err.stack);
    // Why: This is literally what the option says to do.
    // eslint-disable-next-line no-process-exit
    if (options.exit) process.exit();
  };
}

export { VitePlugin };
