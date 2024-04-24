import path from 'node:path';

import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
import chalk from 'chalk';
import debug from 'debug';
import fs from 'fs-extra';
import { PRESET_TIMER } from 'listr2';
// eslint-disable-next-line node/no-unpublished-import
import { default as vite } from 'vite';

import { getFlatDependencies } from './util/package';
import { onBuildDone } from './util/plugins';
import ViteConfigGenerator from './ViteConfig';

import type { VitePluginConfig } from './Config';
import type { ForgeMultiHookMap, ResolvedForgeConfig, StartResult } from '@electron-forge/shared-types';
import type { AddressInfo } from 'node:net';
// eslint-disable-next-line node/no-extraneous-import
import type { RollupWatcher } from 'rollup';

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

  private servers: vite.ViteDevServer[] = [];

  init = (dir: string): void => {
    this.setDirectories(dir);

    d('hooking process events');
    process.on('exit', (_code) => this.exitHandler({ cleanup: true }));
    process.on('SIGINT' as NodeJS.Signals, (_signal) => this.exitHandler({ exit: true }));
  };

  public setDirectories(dir: string): void {
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
          await fs.remove(this.baseDir);

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
      resolveForgeConfig: this.resolveForgeConfig,
      packageAfterCopy: this.packageAfterCopy,
    };
  };

  resolveForgeConfig = async (forgeConfig: ResolvedForgeConfig): Promise<ResolvedForgeConfig> => {
    forgeConfig.packagerConfig ??= {};

    if (forgeConfig.packagerConfig.ignore) {
      if (typeof forgeConfig.packagerConfig.ignore !== 'function') {
        console.error(
          chalk.yellow(`You have set packagerConfig.ignore, the Electron Forge Vite plugin normally sets this automatically.

Your packaged app may be larger than expected if you dont ignore everything other than the '.vite' folder`)
        );
      }
      return forgeConfig;
    }

    forgeConfig.packagerConfig.ignore = (file: string) => {
      if (!file) return false;

      // Always starts with `/`
      // @see - https://github.com/electron/packager/blob/v18.1.3/src/copy-filter.ts#L89-L93
      return !file.startsWith('/.vite');
    };
    return forgeConfig;
  };

  packageAfterCopy = async (_forgeConfig: ResolvedForgeConfig, buildPath: string): Promise<void> => {
    const pj = await fs.readJson(path.resolve(this.projectDir, 'package.json'));
    const flatDependencies = await getFlatDependencies(this.projectDir);

    if (!pj.main?.includes('.vite/')) {
      throw new Error(`Electron Forge is configured to use the Vite plugin. The plugin expects the
"main" entry point in "package.json" to be ".vite/*" (where the plugin outputs
the generated files). Instead, it is ${JSON.stringify(pj.main)}`);
    }

    if (pj.config) {
      delete pj.config.forge;
    }

    await fs.writeJson(path.resolve(buildPath, 'package.json'), pj, {
      spaces: 2,
    });

    // Copy the dependencies in package.json
    for (const dep of flatDependencies) {
      await fs.copy(dep.src, path.resolve(buildPath, dep.dest));
    }
  };

  startLogic = async (): Promise<StartResult> => {
    if (VitePlugin.alreadyStarted) return false;
    VitePlugin.alreadyStarted = true;

    await fs.remove(this.baseDir);

    return {
      tasks: [
        {
          title: 'Launching dev servers for renderer process code',
          task: async () => {
            await this.launchRendererDevServers();
          },
          rendererOptions: {
            persistentOutput: true,
            timer: { ...PRESET_TIMER },
          },
        },
        // The main process depends on the `server.port` of the renderer process, so the renderer process is run first.
        {
          title: 'Compiling main process code',
          task: async () => {
            await this.build();
          },
          rendererOptions: {
            timer: { ...PRESET_TIMER },
          },
        },
      ],
      result: false,
    };
  };

  // Main process, Preload scripts and Worker process, etc.
  build = async (): Promise<void> => {
    const configs = await this.configGenerator.getBuildConfig();
    const buildTasks: Promise<void>[] = [];
    const isWatcher = (x: any): x is RollupWatcher => typeof x?.close === 'function';

    for (const userConfig of configs) {
      const buildTask = new Promise<void>((resolve, reject) => {
        vite
          .build({
            // Avoid recursive builds caused by users configuring @electron-forge/plugin-vite in Vite config file.
            configFile: false,
            ...userConfig,
            plugins: [onBuildDone(resolve), ...(userConfig.plugins ?? [])],
          })
          .then((result) => {
            if (isWatcher(result)) {
              this.watchers.push(result);
            }

            return result;
          })
          .catch(reject);
      });

      buildTasks.push(buildTask);
    }

    await Promise.all(buildTasks);
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

      this.servers.push(viteDevServer);

      if (viteDevServer.httpServer) {
        // Make sure that `getDefines` in VitePlugin.ts gets the correct `server.port`. (#3198)
        const addressInfo = viteDevServer.httpServer.address();
        const isAddressInfo = (x: any): x is AddressInfo => x?.address;

        if (isAddressInfo(addressInfo)) {
          userConfig.server ??= {};
          userConfig.server.port = addressInfo.port;
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
