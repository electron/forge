import 'colors';
import { asyncOra } from '@electron-forge/async-ora';
import { StartOptions, ForgePlatform, ForgeArch } from '@electron-forge/shared-types';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

import { readMutatedPackageJson } from '../util/read-package-json';
import rebuild from '../util/rebuild';
import resolveDir from '../util/resolve-dir';
import getForgeConfig from '../util/forge-config';
import { runHook } from '../util/hook';
import getElectronVersion from '../util/electron-version';

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
    return lastSpawned;
  };

  const forgeSpawn = async () => {
    let electronExecPath = require(path.resolve(dir, 'node_modules/electron'));

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
    if (typeof spawnedPluginChild === 'string') {
      electronExecPath = spawnedPluginChild;
    } else if (spawnedPluginChild) {
      await runHook(forgeConfig, 'postStart', spawnedPluginChild);
      return spawnedPluginChild;
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
      spawned = spawn(electronExecPath, [appPath].concat(args as string[]), spawnOpts);
    });

    await runHook(forgeConfig, 'postStart', spawned);
    return spawned;
  };

  if (interactive) {
    process.stdin.on('data', (data) => {
      if (data.toString().trim() === 'rs' && lastSpawned) {
        console.info('\nRestarting App\n'.cyan);
        (lastSpawned as any).restarted = true;
        lastSpawned.kill('SIGTERM');
        forgeSpawnWrapper();
      }
    });
  }

  return forgeSpawnWrapper();
};
