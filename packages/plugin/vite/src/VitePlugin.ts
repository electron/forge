import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
import { ForgeMultiHookMap, StartResult } from '@electron-forge/shared-types';
import debug from 'debug';
// eslint-disable-next-line node/no-extraneous-import
import { RollupWatcher } from 'rollup';
import { loadConfigFromFile, default as vite } from 'vite';

import { VitePluginConfig } from './Config';
import ViteConfigGenerator from './ViteConfig';

const d = debug('electron-forge:plugin:vite');

export default class VitePlugin extends PluginBase<VitePluginConfig> {
  name = 'vite';

  private isProd = false;

  // The root of the Electron app
  private projectDir!: string;

  // Where the Vite output is generated. Usually `${projectDir}/.vite`
  private baseDir!: string;

  private _configGenerator!: Promise<ViteConfigGenerator>;

  private watchers: RollupWatcher[] = [];

  private servers: http.Server[] = [];

  init = (dir: string): void => {
    this.setDirectories(dir);

    d('hooking process events');
    process.on('exit', (_code) => this.exitHandler({ cleanup: true }));
    process.on('SIGINT' as NodeJS.Signals, (_signal) => this.exitHandler({ exit: true }));
  };

  setDirectories = (dir: string): void => {
    this.projectDir = dir;
    this.baseDir = path.join(dir, '.vite');
  };

  get configGenerator(): Promise<ViteConfigGenerator> {
    if (!this._configGenerator) {
      // TODO: alias(mode: m, config: c)
      const { mode = 'development', config: configFile } = this.config.CLIOptions ?? {};
      const command = this.isProd ? 'build' : 'serve';
      this._configGenerator = loadConfigFromFile({ command, mode }, configFile).then(
        (result) => new ViteConfigGenerator(this.config, this.projectDir, this.isProd, result)
      );
    }

    return this._configGenerator;
  }

  getHooks = (): ForgeMultiHookMap => {
    return {
      prePackage: [
        namedHookWithTaskFn<'prePackage'>(async () => {
          this.isProd = true;
          fs.rmSync(this.baseDir, { recursive: true, force: true });

          await this.build();
          await this.buildRenderer();
        }, 'Building vite bundles'),
      ],
    };
  };

  private alreadyStarted = false;
  startLogic = async (): Promise<StartResult> => {
    if (this.alreadyStarted) return false;
    this.alreadyStarted = true;

    fs.rmSync(this.baseDir, { recursive: true, force: true });

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
    const configs = (await this.configGenerator).getBuildConfig(watch);
    for (const userConfig of configs) {
      const buildResult = await vite.build({
        // Avoid recursive builds caused by users configuring @electron-forge/plugin-vite in Vite config file.
        configFile: false,
        ...(await userConfig),
      });

      if (Object.keys(buildResult).includes('close')) {
        this.watchers.push(buildResult as RollupWatcher);
      }
    }
  };

  // Renderer process
  buildRenderer = async (): Promise<void> => {
    await vite.build({
      configFile: false,
      ...(await this.configGenerator).getRendererConfig(),
    });
  };

  launchRendererDevServers = async (): Promise<void> => {
    const viteDevServer = await vite.createServer({
      configFile: false,
      ...(await this.configGenerator).getRendererConfig(),
    });

    await viteDevServer.listen();
    viteDevServer.printUrls();

    if (viteDevServer.httpServer) {
      this.servers.push(viteDevServer.httpServer);
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
