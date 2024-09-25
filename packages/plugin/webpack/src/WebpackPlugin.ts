import crypto from 'crypto';
import http from 'http';
import path from 'path';
import { pipeline } from 'stream/promises';

import { getElectronVersion, listrCompatibleRebuildHook } from '@electron-forge/core-utils';
import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
import { ForgeMultiHookMap, ListrTask, ResolvedForgeConfig } from '@electron-forge/shared-types';
import Logger, { Tab } from '@electron-forge/web-multi-logger';
import chalk from 'chalk';
import debug from 'debug';
import glob from 'fast-glob';
import fs from 'fs-extra';
import { PRESET_TIMER } from 'listr2';
import webpack, { Configuration, Watching } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { merge } from 'webpack-merge';

import { WebpackPluginConfig, WebpackPluginRendererConfig } from './Config';
import ElectronForgeLoggingPlugin from './util/ElectronForgeLogging';
import EntryPointPreloadPlugin from './util/EntryPointPreloadPlugin';
import once from './util/once';
import WebpackConfigGenerator from './WebpackConfig';

const d = debug('electron-forge:plugin:webpack');
const DEFAULT_PORT = 3000;
const DEFAULT_LOGGER_PORT = 9000;

type WebpackToJsonOptions = Parameters<webpack.Stats['toJson']>[0];
type WebpackWatchHandler = Parameters<webpack.Compiler['watch']>[1];

type NativeDepsCtx = {
  nativeDeps: Record<string, string[]>;
};

export default class WebpackPlugin extends PluginBase<WebpackPluginConfig> {
  name = 'webpack';

  private isProd = false;

  // The root of the Electron app
  private projectDir!: string;

  // Where the Webpack output is generated. Usually `$projectDir/.webpack`
  private baseDir!: string;

  private _configGenerator!: WebpackConfigGenerator;

  private watchers: Watching[] = [];

  private servers: http.Server[] = [];

  private loggers: Logger[] = [];

  private port = DEFAULT_PORT;

  private loggerPort = DEFAULT_LOGGER_PORT;

  constructor(c: WebpackPluginConfig) {
    super(c);

    if (c.port) {
      if (this.isValidPort(c.port)) {
        this.port = c.port;
      }
    }
    if (c.loggerPort) {
      if (this.isValidPort(c.loggerPort)) {
        this.loggerPort = c.loggerPort;
      }
    }

    this.getHooks = this.getHooks.bind(this);
  }

  private isValidPort = (port: number) => {
    if (port < 1024) {
      throw new Error(`Cannot specify port (${port}) below 1024, as they are privileged`);
    } else if (port > 65535) {
      throw new Error(`Port specified (${port}) is not a valid TCP port.`);
    } else {
      return true;
    }
  };

  exitHandler = (options: { cleanup?: boolean; exit?: boolean }, err?: Error): void => {
    d('handling process exit with:', options);
    if (options.cleanup) {
      for (const watcher of this.watchers) {
        d('cleaning webpack watcher');
        watcher.close(() => {
          /* Do nothing when the watcher closes */
        });
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
    // Why: This is literally what the option says to do.
    // eslint-disable-next-line no-process-exit
    if (options.exit) process.exit();
  };

  async writeJSONStats(type: string, stats: webpack.Stats | undefined, statsOptions: WebpackToJsonOptions, suffix: string): Promise<void> {
    if (!stats) return;
    d(`Writing JSON stats for ${type} config`);
    const jsonStats = stats.toJson(statsOptions);
    const jsonStatsFilename = path.resolve(this.baseDir, type, `stats-${suffix}.json`);
    await fs.writeJson(jsonStatsFilename, jsonStats, { spaces: 2 });
  }

  private runWebpack = async (options: Configuration[], rendererOptions: WebpackPluginRendererConfig | null): Promise<webpack.MultiStats | undefined> =>
    new Promise((resolve, reject) => {
      webpack(options).run(async (err, stats) => {
        if (rendererOptions && rendererOptions.jsonStats) {
          for (const [index, entryStats] of (stats?.stats ?? []).entries()) {
            const name = rendererOptions.entryPoints[index].name;
            await this.writeJSONStats('renderer', entryStats, options[index].stats as WebpackToJsonOptions, name);
          }
        }
        if (err) {
          return reject(err);
        }
        return resolve(stats);
      });
    });

  init = (dir: string): void => {
    this.setDirectories(dir);

    d('hooking process events');
    process.on('exit', (_code) => this.exitHandler({ cleanup: true }));
    process.on('SIGINT' as NodeJS.Signals, (_signal) => this.exitHandler({ exit: true }));
  };

  setDirectories = (dir: string): void => {
    this.projectDir = dir;
    this.baseDir = path.resolve(dir, '.webpack');
  };

  get configGenerator(): WebpackConfigGenerator {
    if (!this._configGenerator) {
      this._configGenerator = new WebpackConfigGenerator(this.config, this.projectDir, this.isProd, this.port);
    }

    return this._configGenerator;
  }

  getHooks(): ForgeMultiHookMap {
    return {
      preStart: [
        namedHookWithTaskFn<'preStart'>(async (task) => {
          if (this.alreadyStarted) return false;
          this.alreadyStarted = true;

          await fs.remove(this.baseDir);

          const logger = new Logger(this.loggerPort);
          this.loggers.push(logger);
          await logger.start();

          return task?.newListr([
            {
              title: 'Compiling main process code',
              task: async () => {
                await this.compileMain(true, logger);
              },
              rendererOptions: {
                timer: { ...PRESET_TIMER },
              },
            },
            {
              title: 'Launching dev servers for renderer process code',
              task: async (_, task) => {
                await this.launchRendererDevServers(logger);
                task.output = `Output Available: ${chalk.cyan(`http://localhost:${this.loggerPort}`)}\n`;
              },
              rendererOptions: {
                persistentOutput: true,
                timer: { ...PRESET_TIMER },
              },
            },
          ]) as any;
        }, 'Preparing webpack bundles'),
      ],
      prePackage: [
        namedHookWithTaskFn<'prePackage'>(async (task, config, platform, arch) => {
          if (!task) {
            throw new Error('Incompatible usage of webpack-plugin prePackage hook');
          }

          this.isProd = true;
          await fs.remove(this.baseDir);

          // TODO: Figure out how to get matrix from packager
          const arches: string[] = Array.from(
            new Set(arch.split(',').reduce<string[]>((all, pArch) => (pArch === 'universal' ? all.concat(['arm64', 'x64']) : all.concat([pArch])), []))
          );

          const firstArch = arches[0];
          const otherArches = arches.slice(1);

          const multiArchTasks: ListrTask<NativeDepsCtx>[] =
            otherArches.length === 0
              ? []
              : [
                  {
                    title: 'Mapping native dependencies',
                    task: async (ctx: NativeDepsCtx) => {
                      const firstArchDir = path.resolve(this.baseDir, firstArch);
                      const nodeModulesDir = path.resolve(this.projectDir, 'node_modules');
                      const mapping: Record<string, string[]> = Object.create(null);

                      const webpackNodeFiles = await glob('**/*.node', {
                        cwd: firstArchDir,
                      });
                      const nodeModulesNodeFiles = await glob('**/*.node', {
                        cwd: nodeModulesDir,
                      });
                      const hashToNodeModules: Record<string, string[]> = Object.create(null);

                      for (const nodeModulesNodeFile of nodeModulesNodeFiles) {
                        const hash = crypto.createHash('sha256');
                        const resolvedNodeFile = path.resolve(nodeModulesDir, nodeModulesNodeFile);
                        await pipeline(fs.createReadStream(resolvedNodeFile), hash);
                        const digest = hash.digest('hex');

                        hashToNodeModules[digest] = hashToNodeModules[digest] || [];
                        hashToNodeModules[digest].push(resolvedNodeFile);
                      }

                      for (const webpackNodeFile of webpackNodeFiles) {
                        const hash = crypto.createHash('sha256');
                        await pipeline(fs.createReadStream(path.resolve(firstArchDir, webpackNodeFile)), hash);
                        const matchedNodeModule = hashToNodeModules[hash.digest('hex')];
                        if (!matchedNodeModule || !matchedNodeModule.length) {
                          throw new Error(`Could not find originating native module for "${webpackNodeFile}"`);
                        }

                        mapping[webpackNodeFile] = matchedNodeModule;
                      }

                      ctx.nativeDeps = mapping;
                    },
                  },
                  {
                    title: `Generating multi-arch bundles`,
                    task: async (_, task) => {
                      return task.newListr(
                        otherArches.map(
                          (pArch): ListrTask<NativeDepsCtx> => ({
                            title: `Generating ${chalk.magenta(pArch)} bundle`,
                            task: async (_, innerTask) => {
                              return innerTask.newListr(
                                [
                                  {
                                    title: 'Preparing native dependencies',
                                    task: async (_, innerTask) => {
                                      await listrCompatibleRebuildHook(
                                        this.projectDir,
                                        await getElectronVersion(this.projectDir, await fs.readJson(path.join(this.projectDir, 'package.json'))),
                                        platform,
                                        pArch,
                                        config.rebuildConfig,
                                        innerTask
                                      );
                                    },
                                    rendererOptions: {
                                      persistentOutput: true,
                                      bottomBar: Infinity,
                                      showTimer: true,
                                    },
                                  },
                                  {
                                    title: 'Mapping native dependencies',
                                    task: async (ctx) => {
                                      const nodeModulesDir = path.resolve(this.projectDir, 'node_modules');

                                      // Duplicate the firstArch build
                                      const firstDir = path.resolve(this.baseDir, firstArch);
                                      const targetDir = path.resolve(this.baseDir, pArch);
                                      await fs.mkdirp(targetDir);
                                      for (const child of await fs.readdir(firstDir)) {
                                        await fs.promises.cp(path.resolve(firstDir, child), path.resolve(targetDir, child), {
                                          recursive: true,
                                        });
                                      }

                                      const nodeModulesNodeFiles = await glob('**/*.node', {
                                        cwd: nodeModulesDir,
                                      });
                                      const nodeModuleToHash: Record<string, string> = Object.create(null);

                                      for (const nodeModulesNodeFile of nodeModulesNodeFiles) {
                                        const hash = crypto.createHash('sha256');
                                        const resolvedNodeFile = path.resolve(nodeModulesDir, nodeModulesNodeFile);
                                        await pipeline(fs.createReadStream(resolvedNodeFile), hash);

                                        nodeModuleToHash[resolvedNodeFile] = hash.digest('hex');
                                      }

                                      // Use the native module map to find the newly built native modules
                                      for (const nativeDep of Object.keys(ctx.nativeDeps)) {
                                        const archPath = path.resolve(targetDir, nativeDep);
                                        await fs.remove(archPath);

                                        const mappedPaths = ctx.nativeDeps[nativeDep];
                                        if (!mappedPaths || !mappedPaths.length) {
                                          throw new Error(`The "${nativeDep}" module could not be mapped to any native modules on disk`);
                                        }

                                        if (!mappedPaths.every((mappedPath) => nodeModuleToHash[mappedPath] === nodeModuleToHash[mappedPaths[0]])) {
                                          throw new Error(
                                            `The "${nativeDep}" mapped to multiple modules "${mappedPaths.join(
                                              ', '
                                            )}" but the same modules post rebuild did not map to the same native code`
                                          );
                                        }

                                        await fs.promises.cp(mappedPaths[0], archPath);
                                      }
                                    },
                                  },
                                ],
                                { concurrent: false }
                              );
                            },
                          })
                        )
                      );
                    },
                  },
                ];

          return task.newListr<NativeDepsCtx>(
            [
              {
                title: `Preparing native dependencies for ${chalk.magenta(firstArch)}`,
                task: async (_, innerTask) => {
                  await listrCompatibleRebuildHook(
                    this.projectDir,
                    await getElectronVersion(this.projectDir, await fs.readJson(path.join(this.projectDir, 'package.json'))),
                    platform,
                    firstArch,
                    config.rebuildConfig,
                    innerTask
                  );
                },
                rendererOptions: {
                  persistentOutput: true,
                  bottomBar: Infinity,
                  timer: { ...PRESET_TIMER },
                },
              },
              {
                title: 'Building webpack bundles',
                task: async () => {
                  await this.compileMain();
                  await this.compileRenderers();
                  // Store it in a place that won't get messed with
                  // We'll restore the right "arch" in the afterCopy hook further down
                  const preExistingChildren = await fs.readdir(this.baseDir);
                  const targetDir = path.resolve(this.baseDir, firstArch);
                  await fs.mkdirp(targetDir);
                  for (const child of preExistingChildren) {
                    await fs.move(path.resolve(this.baseDir, child), path.resolve(targetDir, child));
                  }
                },
                rendererOptions: {
                  timer: { ...PRESET_TIMER },
                },
              },
              ...multiArchTasks,
            ],
            { concurrent: false }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any;
        }, 'Preparing webpack bundles'),
      ],
      postStart: async (_config, child) => {
        d('hooking electron process exit');
        child.on('exit', () => {
          if (child.restarted) return;
          this.exitHandler({ cleanup: true, exit: true });
        });
      },
      resolveForgeConfig: this.resolveForgeConfig,
      packageAfterCopy: [
        async (_forgeConfig: ResolvedForgeConfig, buildPath: string, _electronVersion: string, _platform: string, pArch: string): Promise<void> => {
          // Restore the correct 'arch' build of webpack
          // Steal the correct arch, wipe the folder, move it back to pretend to be ".webpack" root
          const tmpWebpackDir = path.resolve(buildPath, '.webpack.tmp');
          await fs.move(path.resolve(buildPath, '.webpack', pArch), tmpWebpackDir);
          await fs.remove(path.resolve(buildPath, '.webpack'));
          await fs.move(tmpWebpackDir, path.resolve(buildPath, '.webpack'));
        },
        this.packageAfterCopy,
      ],
    };
  }

  resolveForgeConfig = async (forgeConfig: ResolvedForgeConfig): Promise<ResolvedForgeConfig> => {
    if (!forgeConfig.packagerConfig) {
      forgeConfig.packagerConfig = {};
    }
    if (forgeConfig.packagerConfig.ignore) {
      if (typeof forgeConfig.packagerConfig.ignore !== 'function') {
        console.error(
          chalk.red(`You have set packagerConfig.ignore, the Electron Forge webpack plugin normally sets this automatically.

Your packaged app may be larger than expected if you dont ignore everything other than the '.webpack' folder`)
        );
      }
      return forgeConfig;
    }
    forgeConfig.packagerConfig.ignore = (file: string) => {
      if (!file) return false;

      if (this.config.jsonStats && file.endsWith(path.join('.webpack', 'main', 'stats.json'))) {
        return true;
      }

      if (this.allRendererOptions.some((r) => r.jsonStats) && file.endsWith(path.join('.webpack', 'renderer', 'stats.json'))) {
        return true;
      }

      if (!this.config.packageSourceMaps && /[^/\\]+\.js\.map$/.test(file)) {
        return true;
      }

      return !/^[/\\]\.webpack($|[/\\]).*$/.test(file);
    };
    return forgeConfig;
  };

  private get allRendererOptions() {
    return Array.isArray(this.config.renderer) ? this.config.renderer : [this.config.renderer];
  }

  packageAfterCopy = async (_forgeConfig: ResolvedForgeConfig, buildPath: string): Promise<void> => {
    const pj = await fs.readJson(path.resolve(this.projectDir, 'package.json'));

    if (!pj.main?.endsWith('.webpack/main')) {
      throw new Error(`Electron Forge is configured to use the Webpack plugin. The plugin expects the
"main" entry point in "package.json" to be ".webpack/main" (where the plugin outputs
the generated files). Instead, it is ${JSON.stringify(pj.main)}`);
    }

    if (pj.config) {
      delete pj.config.forge;
    }

    await fs.writeJson(path.resolve(buildPath, 'package.json'), pj, {
      spaces: 2,
    });

    await fs.mkdirp(path.resolve(buildPath, 'node_modules'));
  };

  compileMain = async (watch = false, logger?: Logger): Promise<void> => {
    let tab: Tab;
    if (logger) {
      tab = logger.createTab('Main Process');
    }

    const mainConfig = await this.configGenerator.getMainConfig();
    await new Promise((resolve, reject) => {
      const compiler = webpack(mainConfig);
      const [onceResolve, onceReject] = once(resolve, reject);
      const cb: WebpackWatchHandler = async (err, stats) => {
        if (tab && stats) {
          tab.log(
            stats.toString({
              colors: true,
            })
          );
        }
        if (this.config.jsonStats) {
          await this.writeJSONStats('main', stats, mainConfig.stats as WebpackToJsonOptions, 'main');
        }

        if (err) return onceReject(err);
        if (!watch && stats?.hasErrors()) {
          return onceReject(new Error(`Compilation errors in the main process: ${stats.toString()}`));
        }

        return onceResolve(undefined);
      };
      if (watch) {
        this.watchers.push(compiler.watch({}, cb));
      } else {
        compiler.run(cb);
      }
    });
  };

  compileRenderers = async (watch = false): Promise<void> => {
    for (const rendererOptions of this.allRendererOptions) {
      const stats = await this.runWebpack(await this.configGenerator.getRendererConfig(rendererOptions), rendererOptions);
      if (!watch && stats?.hasErrors()) {
        throw new Error(`Compilation errors in the renderer: ${stats.toString()}`);
      }
    }
  };

  launchRendererDevServers = async (logger: Logger): Promise<void> => {
    const configs: Configuration[] = [];
    const rollingDependencies: string[] = [];
    for (const [i, rendererOptions] of this.allRendererOptions.entries()) {
      const groupName = `group_${i}`;
      configs.push(
        ...(await this.configGenerator.getRendererConfig(rendererOptions)).map((config) => ({
          ...config,
          name: groupName,
          dependencies: [...rollingDependencies],
        }))
      );
      rollingDependencies.push(groupName);
    }

    if (configs.length === 0) {
      return;
    }

    const preloadPlugins: string[] = [];
    let numPreloadEntriesWithConfig = 0;
    for (const entryConfig of configs) {
      if (!entryConfig.plugins) entryConfig.plugins = [];
      entryConfig.plugins.push(new ElectronForgeLoggingPlugin(logger.createTab(`Renderer Target Bundle (${entryConfig.target})`)));

      const filename = entryConfig.output?.filename as string;
      if (filename?.endsWith('preload.js')) {
        let name = `entry-point-preload-${entryConfig.target}`;
        if (preloadPlugins.includes(name)) {
          name = `${name}-${++numPreloadEntriesWithConfig}`;
        }
        entryConfig.plugins.push(new EntryPointPreloadPlugin({ name }));
        preloadPlugins.push(name);
      }

      entryConfig.infrastructureLogging = {
        level: 'none',
      };
      entryConfig.stats = 'none';
    }

    const compiler = webpack(configs);

    const promises = preloadPlugins.map((preloadPlugin) => {
      return new Promise((resolve, reject) => {
        compiler.hooks.done.tap(preloadPlugin, (stats) => {
          if (stats.hasErrors()) {
            return reject(new Error(`Compilation errors in the preload: ${stats.toString()}`));
          }
          return resolve(undefined);
        });
      });
    });

    const webpackDevServer = new WebpackDevServer(this.devServerOptions(), compiler);
    await webpackDevServer.start();
    this.servers.push(webpackDevServer.server!);
    await Promise.all(promises);
  };

  devServerOptions(): WebpackDevServer.Configuration {
    const cspDirectives =
      this.config.devContentSecurityPolicy ?? "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:";

    const defaults: Partial<WebpackDevServer.Configuration> = {
      hot: true,
      devMiddleware: {
        writeToDisk: true,
      },
      historyApiFallback: true,
    };
    const overrides: Partial<WebpackDevServer.Configuration> = {
      port: this.port,
      setupExitSignals: true,
      static: path.resolve(this.baseDir, 'renderer'),
      headers: {
        ...this.config.devServer?.headers,
        'Content-Security-Policy': cspDirectives,
      },
    };

    return merge(defaults, this.config.devServer ?? {}, overrides);
  }

  private alreadyStarted = false;
}

export { WebpackPlugin, WebpackPluginConfig };
