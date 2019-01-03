import 'colors';
import { asyncOra } from '@electron-forge/async-ora';
import { StartOptions, ForgePlatform, ForgeArch } from '@electron-forge/shared-types';
import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import path from 'path';

import { readMutatedPackageJson } from '../util/read-package-json';
import rebuild from '../util/rebuild';
import resolveDir from '../util/resolve-dir';
import getForgeConfig from '../util/forge-config';
import { runHook } from '../util/hook';
import { getElectronVersion } from '../util/electron-version';

export { StartOptions };

export default async ({
  dir = process.cwd(),
  appPath = '.',
  interactive = false,
  enableLogging = false,
  args = [],
  runAsNode = false,
  inspect = false,
}: StartOptions) => {
  asyncOra.interactive = interactive;

  await asyncOra('Locating Application', async () => {
    const resolvedDir = await resolveDir(dir);
    if (!resolvedDir) {
      throw 'Failed to locate startable Electron application';
    }
    dir = resolvedDir;
  });

  const forgeConfig = await getForgeConfig(dir);
  const packageJSON = await readMutatedPackageJson(dir, forgeConfig);

  if (!packageJSON.version) {
    throw `Please set your application's 'version' in '${dir}/package.json'.`;
  }

  await rebuild(
    dir,
    getElectronVersion(packageJSON),
    process.platform as ForgePlatform,
    process.arch as ForgeArch,
    forgeConfig.electronRebuildConfig,
  );

  await runHook(forgeConfig, 'generateAssets');

  let lastSpawned: ChildProcess | null = null;

  const forgeSpawnWrapper = async () => {
    lastSpawned = await forgeSpawn();
    // When the child app is closed we should stop listening for stdin
    if (lastSpawned) {
      if (interactive && process.stdin.isPaused()) {
        process.stdin.resume();
      }
      lastSpawned.on('exit', () => {
        if ((lastSpawned as any).restarted) return;

        if (!process.stdin.isPaused()) process.stdin.pause();
      });
    } else {
      if (interactive && !process.stdin.isPaused()) {
        process.stdin.pause();
      }
    }
    return lastSpawned;
  };

  const forgeSpawn = async () => {
    let electronExecPath: string | null = null;

    // If a plugin has taken over the start command let's stop here
    const spawnedPluginChild = await forgeConfig.pluginInterface.overrideStartLogic({
      dir,
      appPath,
      interactive,
      enableLogging,
      args,
      runAsNode,
      inspect,
    });
    let prefixArgs: string[] = [];
    if (typeof spawnedPluginChild === 'string') {
      electronExecPath = spawnedPluginChild;
    } else if (Array.isArray(spawnedPluginChild)) {
      electronExecPath = spawnedPluginChild[0];
      prefixArgs = spawnedPluginChild.slice(1);
    } else if (spawnedPluginChild) {
      await runHook(forgeConfig, 'postStart', spawnedPluginChild);
      return spawnedPluginChild;
    }

    if (!electronExecPath) {
      electronExecPath = require(path.resolve(dir, 'node_modules/electron'));
    }

    const spawnOpts = {
      cwd: dir,
      stdio: 'inherit',
      env: Object.assign({}, process.env, enableLogging ? {
        ELECTRON_ENABLE_LOGGING: 'true',
        ELECTRON_ENABLE_STACK_DUMPING: 'true',
      } : {}) as NodeJS.ProcessEnv,
    };

    if (runAsNode) {
      spawnOpts.env.ELECTRON_RUN_AS_NODE = 'true';
    } else {
      delete spawnOpts.env.ELECTRON_RUN_AS_NODE;
    }

    if (inspect) {
      args = ['--inspect' as (string|number)].concat(args);
    }

    let spawned!: ChildProcess;

    await asyncOra('Launching Application', async () => {
      spawned = spawn(electronExecPath!, prefixArgs.concat([appPath]).concat(args as string[]), spawnOpts as SpawnOptions);
    });

    await runHook(forgeConfig, 'postStart', spawned);
    return spawned;
  };

  if (interactive) {
    process.stdin.on('data', async (data) => {
      if (data.toString().trim() === 'rs' && lastSpawned) {
        console.info('\nRestarting App\n'.cyan);
        (lastSpawned as any).restarted = true;
        lastSpawned.kill('SIGTERM');
        lastSpawned.emit('restarted', await forgeSpawnWrapper());
      }
    });
  }

  return forgeSpawnWrapper();
};
