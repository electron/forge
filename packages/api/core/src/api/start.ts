import { spawn, SpawnOptions } from 'node:child_process';
import readline from 'node:readline';

import {
  getElectronVersion,
  listrCompatibleRebuildHook,
} from '@electron-forge/core-utils';
import {
  requestAppRestart,
  setAppRestartHandler,
} from '@electron-forge/core-utils/restart';
import {
  ElectronProcess,
  ForgeArch,
  ForgeListrOptions,
  ForgeListrTaskFn,
  ForgePlatform,
  ResolvedForgeConfig,
  StartOptions,
} from '@electron-forge/shared-types';
import { autoTrace, delayTraceTillSignal } from '@electron-forge/tracer';
import chalk from 'chalk';
import debug from 'debug';
import { Listr, PRESET_TIMER } from 'listr2';

import locateElectronExecutable from '../util/electron-executable.js';
import getForgeConfig from '../util/forge-config.js';
import { getHookListrTasks, runHook } from '../util/hook.js';
import { readMutatedPackageJson } from '../util/read-package-json.js';
import resolveDir from '../util/resolve-dir.js';

const d = debug('electron-forge:start');

export { StartOptions };

type StartContext = {
  dir: string;
  forgeConfig: ResolvedForgeConfig;
  packageJSON: any;
  spawned: ElectronProcess;
};

export default autoTrace(
  { name: 'start()', category: '@electron-forge/core' },
  async (
    childTrace,
    {
      dir: providedDir = process.cwd(),
      appPath = '.',
      interactive = false,
      enableLogging = false,
      args = [],
      runAsNode = false,
      inspect = false,
      inspectBrk = false,
    }: StartOptions,
  ): Promise<ElectronProcess> => {
    const platform = process.env.npm_config_platform || process.platform;
    const arch = process.env.npm_config_arch || process.arch;
    const listrOptions: ForgeListrOptions<StartContext> = {
      concurrent: false,
      registerSignalListeners: false, // Don't re-render on SIGINT
      rendererOptions: {
        collapseErrors: false,
        collapseSubtasks: false,
      },
      silentRendererCondition: !interactive,
      fallbackRendererCondition:
        Boolean(process.env.DEBUG) || Boolean(process.env.CI),
    };

    const runner = new Listr<StartContext>(
      [
        {
          title: 'Locating application',
          task: childTrace<Parameters<ForgeListrTaskFn<StartContext>>>(
            { name: 'locate-application', category: '@electron-forge/core' },
            async (_, ctx) => {
              const resolvedDir = await resolveDir(providedDir);
              if (!resolvedDir) {
                throw new Error(
                  'Failed to locate startable Electron application',
                );
              }
              ctx.dir = resolvedDir;
            },
          ),
        },
        {
          title: 'Loading configuration',
          task: childTrace<Parameters<ForgeListrTaskFn<StartContext>>>(
            { name: 'load-forge-config', category: '@electron-forge/core' },
            async (_, ctx) => {
              const { dir } = ctx;
              ctx.forgeConfig = await getForgeConfig(dir);
              ctx.packageJSON = await readMutatedPackageJson(
                dir,
                ctx.forgeConfig,
              );

              if (!ctx.packageJSON.version) {
                throw new Error(
                  `Please set your application's 'version' in '${dir}/package.json'.`,
                );
              }
            },
          ),
        },
        {
          title: 'Preparing native dependencies',
          task: childTrace<Parameters<ForgeListrTaskFn<StartContext>>>(
            {
              name: 'prepare-native-dependencies',
              category: '@electron-forge/core',
            },
            async (_, { dir, forgeConfig, packageJSON }, task) => {
              await listrCompatibleRebuildHook(
                dir,
                await getElectronVersion(dir, packageJSON),
                platform as ForgePlatform,
                arch as ForgeArch,
                forgeConfig.rebuildConfig,
                task as any,
              );
            },
          ),
          rendererOptions: {
            persistentOutput: true,
            bottomBar: Infinity,
            timer: { ...PRESET_TIMER },
          },
        },
        {
          title: `Running ${chalk.yellow('generateAssets')} hook`,
          task: childTrace<Parameters<ForgeListrTaskFn<StartContext>>>(
            {
              name: 'run-generateAssets-hook',
              category: '@electron-forge/core',
            },
            async (childTrace, { forgeConfig }, task) => {
              return delayTraceTillSignal(
                childTrace,
                task.newListr(
                  await getHookListrTasks(
                    childTrace,
                    forgeConfig,
                    'generateAssets',
                    platform as ForgePlatform,
                    arch as ForgeArch,
                  ),
                ),
                'run',
              );
            },
          ),
        },
        {
          title: `Running ${chalk.yellow('preStart')} hook`,
          task: childTrace<Parameters<ForgeListrTaskFn<StartContext>>>(
            { name: 'run-preStart-hook', category: '@electron-forge/core' },
            async (childTrace, { forgeConfig }, task) => {
              return delayTraceTillSignal(
                childTrace,
                task.newListr(
                  await getHookListrTasks(childTrace, forgeConfig, 'preStart'),
                ),
                'run',
              );
            },
          ),
        },
        {
          task: (_ctx, task) => {
            task.title = `${chalk.dim(`Launched Electron app. Type`)} ${chalk.bold('rs')} ${chalk.dim(`in terminal to restart main process.`)}`;
          },
        },
      ],
      listrOptions,
    );

    await runner.run();

    const { dir, forgeConfig, packageJSON } = runner.ctx;
    let lastSpawned: ElectronProcess | null = null;

    const forgeSpawn = async () => {
      let electronExecPath: string | null = null;

      // If a plugin has taken over the start command let's stop here
      let spawnedPluginChild =
        await forgeConfig.pluginInterface.overrideStartLogic({
          dir,
          appPath,
          interactive,
          enableLogging,
          args,
          runAsNode,
          inspect,
          inspectBrk,
        });
      if (
        typeof spawnedPluginChild === 'object' &&
        'tasks' in spawnedPluginChild
      ) {
        const innerRunner = new Listr<never>(
          [],
          listrOptions as ForgeListrOptions<never>,
        );
        for (const task of spawnedPluginChild.tasks) {
          innerRunner.add(task);
        }
        await innerRunner.run();
        spawnedPluginChild = spawnedPluginChild.result;
      }
      let prefixArgs: string[] = [];
      if (typeof spawnedPluginChild === 'string') {
        electronExecPath = spawnedPluginChild;
      } else if (Array.isArray(spawnedPluginChild)) {
        [electronExecPath, ...prefixArgs] = spawnedPluginChild;
      } else if (spawnedPluginChild) {
        await runHook(forgeConfig, 'postStart', spawnedPluginChild);
        return spawnedPluginChild;
      }

      if (!electronExecPath) {
        electronExecPath = await locateElectronExecutable(dir, packageJSON);
      }

      d('Electron binary path:', electronExecPath);

      const spawnOpts = {
        cwd: dir,
        stdio: 'inherit',
        env: {
          ...process.env,
          ...(enableLogging
            ? {
                ELECTRON_ENABLE_LOGGING: 'true',
                ELECTRON_ENABLE_STACK_DUMPING: 'true',
              }
            : {}),
        } as NodeJS.ProcessEnv,
      };

      if (runAsNode) {
        spawnOpts.env.ELECTRON_RUN_AS_NODE = 'true';
      } else {
        delete spawnOpts.env.ELECTRON_RUN_AS_NODE;
      }

      if (inspect) {
        args = ['--inspect' as string | number].concat(args);
      }
      if (inspectBrk) {
        args = ['--inspect-brk' as string | number].concat(args);
      }

      const spawned = spawn(
        electronExecPath!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        prefixArgs.concat([appPath]).concat(args as string[]),
        spawnOpts as SpawnOptions,
      ) as ElectronProcess;

      await runHook(forgeConfig, 'postStart', spawned);
      return spawned;
    };

    const forgeSpawnWrapper = async () => {
      const spawned = await forgeSpawn();
      // When the child app is closed we should stop listening for stdin
      if (spawned) {
        // `restarted` is non-optional on `ElectronProcess`, so don't leave it
        // `undefined` until the first restart.
        spawned.restarted = false;

        if (interactive && process.stdin.isPaused()) {
          process.stdin.resume();
        }
        spawned.on('exit', () => {
          if (spawned.restarted) {
            return;
          }

          if (interactive && !process.stdin.isPaused()) {
            process.stdin.pause();
          }
        });

        // On close, reset lastSpawned, it's dead. A restart may already have put
        // a replacement there, so only clear our own child.
        spawned.on('close', () => {
          if (lastSpawned === spawned) {
            lastSpawned = null;
          }
        });
      } else if (interactive && !process.stdin.isPaused()) {
        process.stdin.pause();
      }

      lastSpawned = spawned;
      return lastSpawned;
    };

    // A restart spans kill -> exit -> respawn, during which `lastSpawned` is
    // briefly null. Track that window so a request landing in it gets queued
    // rather than mistaken for "there is nothing to restart".
    let restartInFlight = false;
    let restartPending = false;

    const restartRunningApp = (): boolean => {
      if (restartInFlight) {
        d('a restart is already in flight, queueing a follow-up restart');
        restartPending = true;
        return true;
      }

      if (!lastSpawned || lastSpawned.restarted) {
        d('restart requested, but no Electron app is running');
        return false;
      }

      const dying = lastSpawned;
      restartInFlight = true;
      console.info(
        `${chalk.green('✔ ')}${chalk.dim('Restarting Electron app')}`,
      );
      dying.restarted = true;
      dying.on('exit', () => {
        forgeSpawnWrapper().then(
          (child) => {
            restartInFlight = false;
            // Emit on the *exiting* child: its `restarted` listeners are what
            // re-attach the CLI's exit handling to the replacement.
            dying.emit('restarted', child);

            if (restartPending) {
              restartPending = false;
              restartRunningApp();
            }
          },
          (err) => {
            restartInFlight = false;
            restartPending = false;
            console.error(
              chalk.red(
                'Failed to relaunch the Electron app after a restart, so it is no longer running.',
              ),
            );
            console.error(err);
          },
        );
      });
      dying.kill('SIGTERM');
      return true;
    };

    setAppRestartHandler(restartRunningApp);

    if (interactive) {
      process.stdin.on('data', (data) => {
        if (data.toString().trim() !== 'rs') return;

        // Erase the echoed `rs` only when the "Restarting Electron app" line is
        // about to take its place; otherwise we would eat a line of the app's
        // own output.
        if (lastSpawned && !lastSpawned.restarted) {
          readline.moveCursor(process.stdout, 0, -1);
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
        }

        requestAppRestart();
      });
      process.stdin.resume();

      const handleTerminationSignal = function (signal: NodeJS.Signals) {
        process.on(signal, function signalHandler() {
          lastSpawned?.kill(signal);
        });
      };

      handleTerminationSignal('SIGINT');
      handleTerminationSignal('SIGTERM');
      handleTerminationSignal('SIGUSR2');
    }

    const spawned = await forgeSpawnWrapper();

    if (interactive) console.log('');

    return spawned;
  },
);
