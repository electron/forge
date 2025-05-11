// TODO(erickzhao): Remove this when upgrading to Vite 6 and converting to ESM
process.env.VITE_CJS_IGNORE_WARNING = 'true';

import path from 'node:path';

import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
import chalk from 'chalk';
import debug from 'debug';
import fs from 'fs-extra';
import { delay, Listr, PRESET_TIMER } from 'listr2';
import { Logger, default as vite } from 'vite';

import ViteConfigGenerator from './ViteConfig';

import type { VitePluginConfig } from './Config';
import type { ForgeListrTask, ForgeMultiHookMap, ResolvedForgeConfig } from '@electron-forge/shared-types';
import type { AddressInfo } from 'node:net';

const d = debug('electron-forge:plugin:vite');

export default class VitePlugin extends PluginBase<VitePluginConfig> {
  private static alreadyStarted = false;

  public name = 'vite';

  private isProd = false;

  /**
   * Path to the root of the Electron app
   */
  private projectDir!: string;

  /**
   * Path where Vite output is generated. Usually `${projectDir}/.vite`
   */
  private baseDir!: string;

  private configGeneratorCache!: ViteConfigGenerator;

  private watchers: vite.Rollup.RollupWatcher[] = [];

  private servers: vite.ViteDevServer[] = [];

  init = (dir: string): void => {
    this.setDirectories(dir);

    d('hooking process events');
    process.on('exit', (_code) => {
      this.exitHandler({ cleanup: true });
    });
    process.on('SIGINT' as NodeJS.Signals, (_signal) => {
      this.exitHandler({ exit: true });
    });
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
      preStart: [
        namedHookWithTaskFn<'preStart'>(async (task) => {
          if (VitePlugin.alreadyStarted) return;
          VitePlugin.alreadyStarted = true;

          d(`preStart: removing old content from ${this.baseDir}`);
          await fs.remove(this.baseDir);

          return task?.newListr(
            [
              {
                title: 'Launching Vite dev servers for renderer process code...',
                task: async (_ctx, task) => {
                  const fn = (...args: string[]) => {
                    if (task) {
                      task.output = task.output?.concat('\n', args.join(' ')) ?? args.join(' ');
                    }
                  };

                  const logger: Logger = vite.createLogger();

                  logger.info = (msg) => {
                    fn(msg);
                  };
                  logger.warn = (msg) => {
                    fn(chalk.yellow(msg));
                  };
                  logger.error = (msg) => {
                    fn(chalk.red(msg));
                  };
                  await this.launchRendererDevServers(logger);
                  task.title = 'Launched Vite dev servers for renderer process code';
                },
                rendererOptions: {
                  persistentOutput: true,
                  timer: { ...PRESET_TIMER },
                },
              },
              // The main process depends on the `server.port` of the renderer process, so the renderer process is run first.
              {
                title: 'Building main process and preload bundles...',
                task: async (_ctx, task) => {
                  return this.build(task);
                },
                rendererOptions: {
                  persistentOutput: true,
                  timer: { ...PRESET_TIMER },
                },
              },
            ],
            { concurrent: false }
          );
        }, 'Preparing Vite bundles'),
      ],
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

      // `file` always starts with `/`
      // @see - https://github.com/electron/packager/blob/v18.1.3/src/copy-filter.ts#L89-L93

      // Collect the files built by Vite
      return !file.startsWith('/.vite');
    };
    return forgeConfig;
  };

  packageAfterCopy = async (_forgeConfig: ResolvedForgeConfig, buildPath: string): Promise<void> => {
    const pj = await fs.readJson(path.resolve(this.projectDir, 'package.json'));

    if (!pj.main?.includes('.vite/')) {
      throw new Error(`Electron Forge is configured to use the Vite plugin. The plugin expects the
"main" entry point in "package.json" to be ".vite/*" (where the plugin outputs
the generated files). Instead, it is ${JSON.stringify(pj.main)}.`);
    }

    if (pj.config) {
      delete pj.config.forge;
    }

    await fs.writeJson(path.resolve(buildPath, 'package.json'), pj, { spaces: 2 });
  };

  // Main process, Preload scripts and Worker process, etc.
  build = async (task?: ForgeListrTask<null>): Promise<Listr | void> => {
    const configs = await this.configGenerator.getBuildConfigs();
    const isRollupWatcher = (x: vite.Rollup.RollupWatcher | vite.Rollup.RollupOutput | vite.Rollup.RollupOutput[]): x is vite.Rollup.RollupWatcher => true;

    return task?.newListr(
      configs.map((userConfig) => {
        const target = userConfig.build?.rollupOptions?.input || (userConfig.build?.lib as any).entry;
        return {
          title: `Building ${chalk.green(target)} bundle`,
          task: async (_ctx, subtask) => {
            const log = (...args: string[]) => {
              subtask.output = args.join(' ');
            };

            const customLogger: Logger = vite.createLogger();

            customLogger.info = (msg) => {
              log(msg);
            };
            customLogger.warn = (msg) => {
              log(chalk.yellow(msg));
            };
            customLogger.error = (msg) => {
              log(chalk.red(msg));
            };

            const result = await vite.build({
              // Avoid recursive builds caused by users configuring @electron-forge/plugin-vite in Vite config file.
              configFile: false,
              customLogger,
              logLevel: 'warn',
              ...userConfig,
              plugins: [...(userConfig.plugins ?? [])],
              clearScreen: true,
            });
            await delay(150);

            if (isRollupWatcher(result)) {
              this.watchers.push(result);
            }
            subtask.title = `Watching for changes to ${chalk.green(target)}`;
          },
          rendererOptions: {
            persistentOutput: true,
            timer: { ...PRESET_TIMER },
          },
          exitOnError: true,
        };
      }),
      {
        concurrent: true,
      }
    );
  };

  // Renderer process
  buildRenderer = async (logger?: Logger): Promise<void> => {
    for (const userConfig of await this.configGenerator.getRendererConfig()) {
      await vite.build({
        customLogger: logger,
        configFile: false,
        ...userConfig,
      });
    }
  };

  launchRendererDevServers = async (logger?: Logger): Promise<void> => {
    for (const userConfig of await this.configGenerator.getRendererConfig()) {
      const viteDevServer = await vite.createServer({
        customLogger: logger,
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
    if (options.exit) process.exit(0);
  };
}

export { VitePlugin };
