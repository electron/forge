import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { styleText } from 'node:util';

import { readJson, writeJson } from '@electron-forge/core-utils';
import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
import debug from 'debug';
import { Listr, PRESET_TIMER } from 'listr2';
import * as vite from 'vite';

import { viteDevServerUrls } from './config/vite.base.config.js';
import {
  applyNativeModuleOverrides,
  detectNativePackages,
  walkTransitiveDependencies,
} from './detect-native-modules.js';
import ViteConfigGenerator from './ViteConfig.js';

import type { VitePluginConfig } from './Config.js';
import type {
  ForgeListrTask,
  ForgeMultiHookMap,
  ForgePackagerOptions,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import type { ChildProcess } from 'node:child_process';
import type { AddressInfo } from 'node:net';
import type { LibraryOptions } from 'vite';

const d = debug('electron-forge:plugin:vite');

const subprocessWorkerPath = path.resolve(
  import.meta.dirname,
  'subprocess-worker.js',
);

function spawnViteBuild(
  pluginConfig: Pick<VitePluginConfig, 'build' | 'renderer' | 'nativeModules'>,
  kind: 'build' | 'renderer',
  index: number,
  projectDir: string,
) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [subprocessWorkerPath], {
      cwd: projectDir,
      env: {
        ...process.env,
        FORGE_VITE_PROJECT_DIR: projectDir,
        FORGE_VITE_KIND: kind,
        FORGE_VITE_INDEX: String(index),
        FORGE_VITE_CONFIG: JSON.stringify(pluginConfig),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        const output = [stdout, stderr].filter(Boolean).join('\n');
        const reason = signal
          ? `killed by signal ${signal}`
          : `exited with code ${code}`;
        reject(
          new Error(
            `Vite build subprocess ${reason}${output ? `:\n${output}` : ''}`,
          ),
        );
      }
    });
  });
}

function spawnViteBuildWatch(
  pluginConfig: Pick<VitePluginConfig, 'build' | 'renderer' | 'nativeModules'>,
  index: number,
  projectDir: string,
  devServerUrls: Record<string, string>,
  onReloadRenderers: () => void,
): { child: ChildProcess; firstBuild: Promise<void> } {
  const child = spawn(process.execPath, [subprocessWorkerPath], {
    cwd: projectDir,
    env: {
      ...process.env,
      FORGE_VITE_PROJECT_DIR: projectDir,
      FORGE_VITE_KIND: 'build',
      FORGE_VITE_INDEX: String(index),
      FORGE_VITE_CONFIG: JSON.stringify(pluginConfig),
      FORGE_VITE_WATCH: '1',
      FORGE_VITE_DEV_SERVER_URLS: JSON.stringify(devServerUrls),
    },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });

  let settled = false;
  let stderr = '';
  child.stderr!.setEncoding('utf8');
  child.stderr!.on('data', (chunk) => {
    if (!settled) stderr += chunk;
    process.stderr.write(chunk);
  });
  child.stdout!.setEncoding('utf8');
  child.stdout!.on('data', (chunk) => process.stdout.write(chunk));

  const firstBuild = new Promise<void>((resolve, reject) => {
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      stderr = '';
      fn();
    };

    child.on('message', (msg: { type: string; message?: string }) => {
      if (msg.type === 'first-build-done') {
        settle(resolve);
      } else if (msg.type === 'first-build-error') {
        settle(() => reject(new Error(msg.message)));
      } else if (msg.type === 'reload-renderers') {
        onReloadRenderers();
      }
    });
    child.on('error', (err) => settle(() => reject(err)));
    child.on('close', (code, signal) => {
      const reason = signal
        ? `killed by signal ${signal}`
        : `exited with code ${code}`;
      settle(() =>
        reject(
          new Error(
            `Vite watch subprocess ${reason} before first build completed${stderr ? `:\n${stderr}` : ''}`,
          ),
        ),
      );
    });
  });

  return { child, firstBuild };
}

/**
 * Normalize the packager `ignore` option (function, RegExp, or array of
 * RegExps/patterns) into a predicate so the plugin can compose the user's
 * ignore with its own.
 */
function normalizeIgnore(
  ignore: ForgePackagerOptions['ignore'],
): ((file: string) => boolean) | undefined {
  if (ignore == null) return undefined;
  if (typeof ignore === 'function') {
    return ignore as (file: string) => boolean;
  }
  const patterns = (Array.isArray(ignore) ? ignore : [ignore]).map((pattern) =>
    pattern instanceof RegExp ? pattern : new RegExp(String(pattern)),
  );
  return (file: string) => patterns.some((pattern) => pattern.test(file));
}

function entryToDisplay(entry: LibraryOptions['entry']): string {
  if (typeof entry === 'string') return entry;
  if (Array.isArray(entry)) return entry.join(' ');
  return Object.keys(entry).join(' ');
}

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

  private watchChildren: ChildProcess[] = [];

  private servers: vite.ViteDevServer[] = [];

  private externalModules = new Set<string>();

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
          await fs.rm(this.baseDir, { recursive: true, force: true });

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
          await fs.rm(this.baseDir, { recursive: true, force: true });

          return task?.newListr(
            [
              {
                title: 'Building Vite targets...',
                task: async (_ctx, subtask) => {
                  return subtask.newListr(
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
                },
              },
              {
                title: 'Detecting native dependencies...',
                task: async (_ctx, subtask) => {
                  const nativePackages = applyNativeModuleOverrides(
                    detectNativePackages(this.projectDir),
                    this.config.nativeModules,
                  );
                  this.externalModules = walkTransitiveDependencies(
                    this.projectDir,
                    nativePackages,
                  );
                  if (this.externalModules.size > 0) {
                    subtask.title = `Detected externalized dependencies: ${[...this.externalModules].join(', ')}`;
                  } else {
                    subtask.title = 'No externalized dependencies detected';
                  }
                },
              },
            ],
            { concurrent: false },
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

  /**
   * Whether the plugin needs `file` to survive the packager copy step for the
   * packaged app to work: the Vite output (`/.vite`), the app's
   * `/package.json`, the `/node_modules` directory itself, and the directories
   * of native modules (plus their transitive dependencies) that were
   * externalized from the Vite bundle. `this.externalModules` is populated
   * during prePackage after the Vite build completes.
   *
   * `file` always starts with `/`
   * @see - https://github.com/electron/packager/blob/v18.1.3/src/copy-filter.ts#L89-L93
   */
  private mustKeepForPackage = (file: string): boolean => {
    if (file.startsWith('/.vite')) return true;
    if (file === '/package.json') return true;

    if (file === '/node_modules') return true;
    if (file.startsWith('/node_modules/')) {
      const bare = file.slice('/node_modules/'.length);
      const segments = bare.split('/');
      if (segments[0].startsWith('@')) {
        // A bare scope directory (e.g. `/node_modules/@serialport`) must be
        // kept whenever any allowlisted module lives under it — if the
        // directory itself is ignored, packager never descends into it.
        if (segments.length === 1) {
          for (const name of this.externalModules) {
            if (name.startsWith(`${segments[0]}/`)) return true;
          }
          return false;
        }
        return this.externalModules.has(`${segments[0]}/${segments[1]}`);
      }
      return this.externalModules.has(segments[0]);
    }

    return false;
  };

  resolveForgeConfig = async (
    forgeConfig: ResolvedForgeConfig,
  ): Promise<ResolvedForgeConfig> => {
    forgeConfig.packagerConfig ??= {};

    const userIgnore = normalizeIgnore(forgeConfig.packagerConfig.ignore);

    // Compose the user's ignore with the plugin's own logic instead of
    // deferring to the user entirely: a path is ignored if either the user's
    // ignore or the plugin's ignore excludes it. The plugin's keep-list is
    // checked first and always wins, because without the Vite output, the
    // app's package.json and the externalized native modules the packaged app
    // cannot start at all — a user ignore pattern like /node_modules/ or /^\/(?!\.vite)/
    // (both common before this plugin handled ignore automatically) would
    // otherwise silently strip files the plugin just externalized for.
    forgeConfig.packagerConfig.ignore = (file: string) => {
      if (!file) return false;

      // Paths the plugin must keep always survive, even if the user's ignore
      // matches them — see comment above.
      if (this.mustKeepForPackage(file)) return false;

      if (userIgnore?.(file)) return true;

      // The plugin's default behaviour: everything that is not on the
      // keep-list is excluded from the packaged app.
      return true;
    };
    return forgeConfig;
  };

  packageAfterCopy = async (
    _forgeConfig: ResolvedForgeConfig,
    buildPath: string,
  ): Promise<void> => {
    const pj = await readJson(path.resolve(this.projectDir, 'package.json'));

    if (!pj.main?.includes('.vite/')) {
      throw new Error(`Electron Forge is configured to use the Vite plugin. The plugin expects the
"main" entry point in "package.json" to be ".vite/*" (where the plugin outputs
the generated files). Instead, it is ${JSON.stringify(pj.main)}.`);
    }

    if (pj.config) {
      delete pj.config.forge;
    }

    await writeJson(path.resolve(buildPath, 'package.json'), pj, {
      spaces: 2,
    });
  };

  /**
   * Serializable snapshot of the plugin config to pass to subprocess workers.
   * We only include build[], renderer[] and nativeModules — the worker needs
   * the full renderer list for defines even when building a single main
   * target, and the nativeModules overrides to build the rollup external list.
   */
  private get serializableConfig(): Pick<
    VitePluginConfig,
    'build' | 'renderer' | 'nativeModules'
  > {
    return {
      build: this.config.build,
      renderer: this.config.renderer,
      nativeModules: this.config.nativeModules,
    };
  }

  // Main process, Preload scripts and Worker process, etc.
  build = async (task?: ForgeListrTask<null>): Promise<Listr | void> => {
    const targets = this.config.build
      .map((spec, index) => ({ spec, index }))
      .filter(({ spec }) => spec.config);

    if (this.isProd) {
      return task?.newListr(
        targets.map(({ spec, index }) => ({
          title: `Building ${styleText('green', entryToDisplay(spec.entry))}`,
          task: async (_ctx, subtask) => {
            await spawnViteBuild(
              this.serializableConfig,
              'build',
              index,
              this.projectDir,
            );
            subtask.title = `Built target ${styleText('dim', entryToDisplay(spec.entry))}`;
          },
        })),
        {
          concurrent: this.config.concurrent ?? true,
          exitOnError: true,
        },
      );
    }

    return task?.newListr(
      targets.map(({ spec, index }) => ({
        title: `Building ${styleText('green', entryToDisplay(spec.entry))} target`,
        task: async () => {
          const { child, firstBuild } = spawnViteBuildWatch(
            this.serializableConfig,
            index,
            this.projectDir,
            viteDevServerUrls,
            () => {
              for (const server of this.servers) {
                server.ws.send({ type: 'full-reload' });
              }
            },
          );
          this.watchChildren.push(child);
          await firstBuild;
        },
      })),
      {
        concurrent: this.config.concurrent ?? true,
        exitOnError: false,
      },
    );
  };

  // Renderer process
  buildRenderer = async (task?: ForgeListrTask<null>) => {
    if (this.isProd) {
      const targets = this.config.renderer
        .map((spec, index) => ({ spec, index }))
        .filter(({ spec }) => spec.config);
      return task?.newListr(
        targets.map(({ spec, index }) => ({
          title: `Building ${styleText('green', spec.name)}`,
          task: async (_ctx, subtask) => {
            await spawnViteBuild(
              this.serializableConfig,
              'renderer',
              index,
              this.projectDir,
            );
            subtask.title = `Built target ${styleText('dim', spec.name)}`;
          },
        })),
        {
          concurrent: this.config.concurrent ?? true,
          exitOnError: true,
        },
      );
    }

    const rendererConfigs = await this.configGenerator.getRendererConfig();
    return task?.newListr(
      rendererConfigs.map((userConfig) => ({
        task: async (_ctx, subtask) => {
          await vite.build({
            configFile: false,
            logLevel: 'error',
            ...userConfig,
          });
          subtask.title = `Built target ${styleText('dim', path.basename(userConfig.build?.outDir ?? ''))}`;
        },
      })),
      {
        concurrent: this.config.concurrent ?? true,
      },
    );
  };

  launchRendererDevServers = async (task?: ForgeListrTask<null>) => {
    const rendererConfigs = await this.configGenerator.getRendererConfig();
    return task?.newListr(
      rendererConfigs.map((userConfig) => ({
        title: `Target ${styleText('cyan', path.basename(userConfig.build?.outDir ?? ''))}`,
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
      for (const child of this.watchChildren) {
        d('killing vite watch subprocess');
        child.kill();
      }
      this.watchChildren = [];

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
    styleText(
      'cyan',
      url.replace(/:(\d+)\//, (_, port) => `:${styleText('bold', port)}/`),
    );
  for (const url of urls.local) {
    output += `  ${styleText('green', '➜')}  ${styleText('bold', 'Local')}:   ${colorUrl(url)}`;
  }
  for (const url of urls.network) {
    output += `  \n${styleText('green', '➜')}  ${styleText('bold', 'Network')}: ${colorUrl(url)}`;
  }
  if (urls.network.length === 0) {
    output +=
      styleText(
        'dim',
        `  \n${styleText('green', '➜')}  ${styleText('bold', 'Network')}: use `,
      ) +
      styleText('bold', '--host') +
      styleText('dim', ' to expose');
  }

  return output;
}

export { VitePlugin };
