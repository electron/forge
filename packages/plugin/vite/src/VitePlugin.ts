import fs from 'node:fs/promises';
import { AddressInfo } from 'node:net';
import path from 'node:path';

import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
import { ForgeMultiHookMap, StartResult } from '@electron-forge/shared-types';
import debug from 'debug';
// eslint-disable-next-line node/no-extraneous-import
import { RollupWatcher } from 'rollup';
import { default as vite } from 'vite';

import { VitePluginConfig, VitePluginRendererConfig } from './Config';
import { hotRestart } from './util/plugins';
import ViteConfigGenerator from './ViteConfig';

const d = debug('electron-forge:plugin:vite');

// 🎯-②:
// Make sure the `server` is bound to the `renderer` in forge.config.ts,
// It's used to refresh the Renderer process, which one can be determined according to `config`.
export interface RendererConfigWithServer {
  config: VitePluginRendererConfig;
  server: vite.ViteDevServer;
}

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

  public renderers: RendererConfigWithServer[] = [];

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
      postStart: async (_config, child) => {
        d('hooking electron process exit');
        child.on('exit', () => {
          if (child.restarted) return;
          this.exitHandler({ cleanup: true, exit: true });
        });
      },
    };
  };

  startLogic = async (): Promise<StartResult> => {
    if (VitePlugin.alreadyStarted) return false;
    VitePlugin.alreadyStarted = true;

    await fs.rm(this.baseDir, { recursive: true, force: true });

    return {
      tasks: [
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
        // The main process depends on the `server.port` of the renderer process, so the renderer process is run first.
        {
          title: 'Compiling main process code',
          task: async () => {
            await this.build(true);
          },
          options: {
            showTimer: true,
          },
        },
      ],
      result: false,
    };
  };

  // Main process, Preload scripts and Worker process, etc.
  build = async (watch = false): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    await Promise.all(
      (
        await this.configGenerator.getBuildConfig(watch)
      ).map(({ config, vite: viteConfig }) => {
        return new Promise<void>((resolve, reject) => {
          vite
            .build({
              // Avoid recursive builds caused by users configuring @electron-forge/plugin-vite in Vite config file.
              configFile: false,
              ...viteConfig,
              plugins: [
                {
                  name: '@electron-forge/plugin-vite:start',
                  closeBundle() {
                    resolve();
                  },
                },
                ...(this.isProd ? [hotRestart(config, that)] : []),
                ...(viteConfig.plugins ?? []),
              ],
            })
            .then((result) => {
              const isWatcher = (x: any): x is RollupWatcher => typeof x?.close === 'function';

              if (isWatcher(result)) {
                this.watchers.push(result);
              }

              return result;
            })
            .catch(reject);
        });
      })
    );
  };

  // Renderer process
  buildRenderer = async (): Promise<void> => {
    for (const { vite: viteConfig } of await this.configGenerator.getRendererConfig()) {
      await vite.build({
        configFile: false,
        ...viteConfig,
      });
    }
  };

  launchRendererDevServers = async (): Promise<void> => {
    for (const { config, vite: viteConfig } of await this.configGenerator.getRendererConfig()) {
      const viteDevServer = await vite.createServer({
        configFile: false,
        ...viteConfig,
      });

      await viteDevServer.listen();
      viteDevServer.printUrls();

      this.renderers.push({
        config,
        server: viteDevServer,
      });

      if (viteDevServer.httpServer) {
        // 🎯-①:
        // Make suee that `getDefines` in VitePlugin.ts gets the correct `server.port`. (#3198)
        const addressInfo = viteDevServer.httpServer.address();
        const isAddressInfo = (x: any): x is AddressInfo => x?.address;

        if (isAddressInfo(addressInfo)) {
          viteConfig.server ??= {};
          viteConfig.server.port = addressInfo.port;
        }
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

      for (const renderer of this.renderers) {
        d('cleaning http server');
        renderer.server.close();
      }
      this.renderers = [];
    }
    if (err) console.error(err.stack);
    // Why: This is literally what the option says to do.
    // eslint-disable-next-line no-process-exit
    if (options.exit) process.exit();
  };
}

export { VitePlugin };
