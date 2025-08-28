// TODO(erickzhao): Remove this when upgrading to Vite 6 and converting to ESM
process.env.VITE_CJS_IGNORE_WARNING = 'true';

import path from 'node:path';

import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
import chalk from 'chalk';
import debug from 'debug';
import fs from 'fs-extra';
import { Listr, PRESET_TIMER } from 'listr2';
import { default as vite } from 'vite';

import { onBuildDone } from './util/plugins';
import ViteConfigGenerator from './ViteConfig';

import type { VitePluginConfig } from './Config';
import type {
  ForgeListrTask,
  ForgeMultiHookMap,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
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

  // Matches the format of the default Vite logger
  private timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

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
    return (this.configGeneratorCache ??= new ViteConfigGenerator(
      this.config,
      this.projectDir,
      this.isProd,
    ));
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
                title:
                  'Launching Vite dev servers for renderer process code...',
                task: async (_ctx, task) => {
                  const result = await this.launchRendererDevServers(task);
                  task.title =
                    'Launched Vite dev servers for renderer process code';
                  return result;
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
                  const result = await this.build(task);
                  task.title = 'Built main process and preload bundles';
                  return result;
                },
                rendererOptions: {
                  persistentOutput: true,
                  timer: { ...PRESET_TIMER },
                },
              },
            ],
            { concurrent: false },
          );
        }, 'Preparing Vite bundles'),
      ],
      prePackage: [
        namedHookWithTaskFn<'prePackage'>(async (task) => {
          this.isProd = true;
          await fs.remove(this.baseDir);

          return task?.newListr(
            [
              {
                title: 'Building main and preload targets...',
                task: async (_ctx, subtask) => {
                  const results = await this.build(subtask);
                  return results;
                },
              },
              {
                title: 'Building renderer targets...',
                task: async (_ctx, subtask) => {
                  const results = await this.buildRenderer(subtask);
                  return results;
                },
              },
            ],
            { concurrent: true },
          );
        }, 'Building production Vite bundles'),
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

  resolveForgeConfig = async (
    forgeConfig: ResolvedForgeConfig,
  ): Promise<ResolvedForgeConfig> => {
    forgeConfig.packagerConfig ??= {};

    if (forgeConfig.packagerConfig.ignore) {
      if (typeof forgeConfig.packagerConfig.ignore !== 'function') {
        console.error(
          chalk.yellow(`You have set packagerConfig.ignore, the Electron Forge Vite plugin normally sets this automatically.

Your packaged app may be larger than expected if you dont ignore everything other than the '.vite' folder`),
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

  packageAfterCopy = async (
    _forgeConfig: ResolvedForgeConfig,
    buildPath: string,
  ): Promise<void> => {
    const pj = await fs.readJson(path.resolve(this.projectDir, 'package.json'));

    if (!pj.main?.includes('.vite/')) {
      throw new Error(`Electron Forge is configured to use the Vite plugin. The plugin expects the
"main" entry point in "package.json" to be ".vite/*" (where the plugin outputs
the generated files). Instead, it is ${JSON.stringify(pj.main)}.`);
    }

    if (pj.config) {
      delete pj.config.forge;
    }

    await fs.writeJson(path.resolve(buildPath, 'package.json'), pj, {
      spaces: 2,
    });
  };

  // Main process, Preload scripts and Worker process, etc.
  build = async (task?: ForgeListrTask<null>): Promise<Listr | void> => {
    const configs = await this.configGenerator.getBuildConfigs();
    const isRollupWatcher = (
      x:
        | vite.Rollup.RollupWatcher
        | vite.Rollup.RollupOutput
        | vite.Rollup.RollupOutput[],
    ): x is vite.Rollup.RollupWatcher =>
      x &&
      typeof x === 'object' &&
      'on' in x &&
      typeof x.on === 'function' &&
      'close' in x &&
      typeof x.close === 'function';

    /**
     * Rollup's `input` can be a string, an array of strings, or an object.
     * This function converts the input to a string for the Forge CLI to consume.
     *
     * @see https://rollupjs.org/configuration-options/#input
     */
    const parseInputOptionToString = (input: vite.Rollup.InputOption) => {
      if (typeof input === 'string') {
        return input;
      } else if (Array.isArray(input)) {
        return input.join(' ');
      } else {
        return Object.keys(input).join(' ');
      }
    };

    return task?.newListr(
      configs.map((userConfig) => {
        let target = '';
        const input = userConfig.build?.rollupOptions?.input;
        if (input) {
          target = parseInputOptionToString(input);
        } else if (
          typeof userConfig.build?.lib !== 'boolean' &&
          userConfig.build?.lib?.entry
        ) {
          target = parseInputOptionToString(userConfig.build.lib.entry);
        }

        return {
          title: `Building ${chalk.green(target)} target`,
          task: async (_ctx, subtask) => {
            // We wrap this function in a Promise to ensure that the task is marked as completed
            // only after all bundles are done generated. This is done in the `closeBundle` Rollup hook
            // rather than when the `vite.build` promise resolves.
            await new Promise<void>((resolve, reject) => {
              vite
                .build({
                  // Avoid recursive builds caused by users configuring @electron-forge/plugin-vite in Vite config file.
                  configFile: false,
                  logLevel: 'silent', // We suppress Vite output and instead log lines using RollupWatcher events
                  ...userConfig,
                  plugins: [
                    onBuildDone(resolve),
                    ...(userConfig.plugins ?? []),
                  ],
                  clearScreen: false,
                })
                .then((result) => {
                  if (isRollupWatcher(result)) {
                    result.on('event', (event) => {
                      if (event.code === 'ERROR') {
                        console.error(
                          `\n${this.timeFormatter.format(new Date())} ${event.error.message}`,
                        );
                        reject(event.error);
                      } else if (event.code === 'BUNDLE_END') {
                        console.log(
                          `${chalk.dim(this.timeFormatter.format(new Date()))} ${chalk.cyan.bold('[@electron-forge/plugin-vite]')} ${chalk.green(
                            'target built',
                          )} ${chalk.dim(target)}`,
                        );
                      }
                    });
                    this.watchers.push(result);
                  } else {
                    subtask.title = `Built target ${chalk.dim(target)}`;
                  }
                  return result;
                })
                .catch(reject);
            });
          },
          rendererOptions: {
            persistentOutput: true,
          },
          exitOnError: true,
        };
      }),
      {
        concurrent: true,
      },
    );
  };

  // Renderer process
  buildRenderer = async (task?: ForgeListrTask<null>) => {
    const rendererConfigs = await this.configGenerator.getRendererConfig();
    return task?.newListr(
      rendererConfigs.map((userConfig) => ({
        task: async (_ctx, subtask) => {
          await vite.build({
            configFile: false,
            logLevel: 'error',
            ...userConfig,
          });
          subtask.title = `Built target ${chalk.dim(path.basename(userConfig.build?.outDir ?? ''))}`;
        },
      })),
    );
  };

  launchRendererDevServers = async (task?: ForgeListrTask<null>) => {
    const rendererConfigs = await this.configGenerator.getRendererConfig();
    return task?.newListr(
      rendererConfigs.map((userConfig) => ({
        title: `Target ${chalk.cyan(path.basename(userConfig.build?.outDir ?? ''))}`,
        task: async (_ctx, subtask) => {
          const viteDevServer = await vite.createServer({
            configFile: false,
            ...userConfig,
          });

          await viteDevServer.listen();
          const urls = getServerURLs(viteDevServer.resolvedUrls!);
          subtask.output = urls;

          this.servers.push(viteDevServer);

          if (viteDevServer.httpServer) {
            // Make sure that `getDefines` in VitePlugin.ts gets the correct `server.port`. (#3198)
            const addressInfo = viteDevServer.httpServer.address();
            const isAddressInfo = (
              x: AddressInfo | string | null,
            ): x is AddressInfo =>
              typeof x === 'object' ? typeof x?.address === 'string' : false;

            if (isAddressInfo(addressInfo)) {
              userConfig.server ??= {};
              userConfig.server.port = addressInfo.port;
            }
          }
        },
        rendererOptions: {
          persistentOutput: true,
        },
      })),
    );
  };

  exitHandler = (
    options: { cleanup?: boolean; exit?: boolean },
    err?: Error,
  ): void => {
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

/**
 * Get a string for Vite's printServerUrls function without actually printing it.
 * Allows us to set `task.output` to that value without having to pass a custom logger into Vite.
 * @see https://github.com/vitejs/vite/blob/42233d39674be808a6a1a79f1a6e44ed23ba0d61/packages/vite/src/node/logger.ts#L168-L188
 */
function getServerURLs(urls: vite.ResolvedServerUrls) {
  let output = '';
  const colorUrl = (url: string) =>
    chalk.cyan(url.replace(/:(\d+)\//, (_, port) => `:${chalk.bold(port)}/`));
  for (const url of urls.local) {
    output += `  ${chalk.green('➜')}  ${chalk.bold('Local')}:   ${colorUrl(url)}`;
  }
  for (const url of urls.network) {
    output += `  \n${chalk.green('➜')}  ${chalk.bold('Network')}: ${colorUrl(url)}`;
  }
  if (urls.network.length === 0) {
    output +=
      chalk.dim(`  \n${chalk.green('➜')}  ${chalk.bold('Network')}: use `) +
      chalk.bold('--host') +
      chalk.dim(' to expose');
  }

  return output;
}

export { VitePlugin };
