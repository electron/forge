import { spawn, SpawnOptions } from 'child_process';

import { getElectronVersion, listrCompatibleRebuildHook } from '@electron-forge/core-utils';
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

import locateElectronExecutable from '../util/electron-executable';
import getForgeConfig from '../util/forge-config';
import { getHookListrTasks, runHook } from '../util/hook';
import { readMutatedPackageJson } from '../util/read-package-json';
import resolveDir from '../util/resolve-dir';

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
    }: StartOptions
  ): Promise<ElectronProcess> => {
    const platform = process.env.npm_config_platform || process.platform;
    const arch = process.env.npm_config_arch || process.arch;
    const listrOptions: ForgeListrOptions<StartContext> = {
      concurrent: false,
      rendererOptions: {
        collapseErrors: false,
      },
      silentRendererCondition: !interactive,
      fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
    };

    const runner = new Listr<StartContext>(
      [
        {
          title: 'Locating application',
          task: childTrace<Parameters<ForgeListrTaskFn<StartContext>>>({ name: 'locate-application', category: '@electron-forge/core' }, async (_, ctx) => {
            const resolvedDir = await resolveDir(providedDir);
            if (!resolvedDir) {
              throw new Error('Failed to locate startable Electron application');
            }
            ctx.dir = resolvedDir;
          }),
        },
        {
          title: 'Loading configuration',
          task: childTrace<Parameters<ForgeListrTaskFn<StartContext>>>({ name: 'load-forge-config', category: '@electron-forge/core' }, async (_, ctx) => {
            const { dir } = ctx;
            ctx.forgeConfig = await getForgeConfig(dir);
            ctx.packageJSON = await readMutatedPackageJson(dir, ctx.forgeConfig);

            if (!ctx.packageJSON.version) {
              throw new Error(`Please set your application's 'version' in '${dir}/package.json'.`);
            }
          }),
        },
        {
          title: 'Preparing native dependencies',
          task: childTrace<Parameters<ForgeListrTaskFn<StartContext>>>(
            { name: 'prepare-native-dependencies', category: '@electron-forge/core' },
            async (_, { dir, forgeConfig, packageJSON }, task) => {
              await listrCompatibleRebuildHook(
                dir,
                await getElectronVersion(dir, packageJSON),
                platform as ForgePlatform,
                arch as ForgeArch,
                forgeConfig.rebuildConfig,
                task as any
              );
            }
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
            { name: 'run-generateAssets-hook', category: '@electron-forge/core' },
            async (childTrace, { forgeConfig }, task) => {
              return delayTraceTillSignal(childTrace, task.newListr(await getHookListrTasks(childTrace, forgeConfig, 'generateAssets', platform, arch)), 'run');
            }
          ),
        },
      ],
      listrOptions
    );

    await runner.run();

    const { dir, forgeConfig, packageJSON } = runner.ctx;
    let lastSpawned: ElectronProcess | null = null;

    const forgeSpawn = async () => {
      let electronExecPath: string | null = null;

      // If a plugin has taken over the start command let's stop here
      let spawnedPluginChild = await forgeConfig.pluginInterface.overrideStartLogic({
        dir,
        appPath,
        interactive,
        enableLogging,
        args,
        runAsNode,
        inspect,
        inspectBrk,
      });
      if (typeof spawnedPluginChild === 'object' && 'tasks' in spawnedPluginChild) {
        const innerRunner = new Listr<never>([], listrOptions as ForgeListrOptions<never>);
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
        spawnOpts as SpawnOptions
      ) as ElectronProcess;

      await runHook(forgeConfig, 'postStart', spawned);
      return spawned;
    };

    const forgeSpawnWrapper = async () => {
      const spawned = await forgeSpawn();
      // When the child app is closed we should stop listening for stdin
      if (spawned) {
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
      } else if (interactive && !process.stdin.isPaused()) {
        process.stdin.pause();
      }

      lastSpawned = spawned;
      return lastSpawned;
    };

    if (interactive) {
      process.stdin.on('data', async (data) => {
        if (data.toString().trim() === 'rs' && lastSpawned) {
          console.info(chalk.cyan('\nRestarting App\n'));
          lastSpawned.restarted = true;
          lastSpawned.kill('SIGTERM');
          lastSpawned.emit('restarted', await forgeSpawnWrapper());
        }
      });
      process.stdin.resume();
    }

    const spawned = await forgeSpawnWrapper();

    if (interactive) console.log('');

    return spawned;
  }
);
