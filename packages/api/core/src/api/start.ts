import 'colors';
import { asyncOra } from '@electron-forge/async-ora';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

import readPackageJSON from '../util/read-package-json';
import rebuild from '../util/rebuild';
import resolveDir from '../util/resolve-dir';
import getForgeConfig from '../util/forge-config';
import runHook from '../util/hook';
import getElectronVersion from '../util/electron-version';
import { ForgePlatform, ForgeArch } from '@electron-forge/shared-types';

export interface StartOptions {
  /**
   * The path to the electron forge project to run
   */
  dir?: string;
  /**
   * The path (relative to dir) to the electron app to run relative to the project directory
   */
  appPath?: string;
  /**
   * Whether to use sensible defaults or prompt the user visually
   */
  interactive?: boolean;
  /**
   * Enables advanced internal Electron debug calls
   */
  enableLogging?: boolean;
  /**
   * Arguments to pass through to the launched Electron application
   */
  args?: string[];
  /**
   * Runs the Electron process as if it were node, disables all Electron API's
   */
  runAsNode?: boolean;
  /**
   * Enables the node inspector, you can connect to this from chrome://inspect
   */
  inspect?: boolean;
}

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

  const packageJSON = await readPackageJSON(dir);

  if (!packageJSON.version) {
    throw `Please set your application's 'version' in '${dir}/package.json'.`;
  }

  const forgeConfig = await getForgeConfig(dir);

  await rebuild(
    dir,
    getElectronVersion(packageJSON),
    process.platform as ForgePlatform,
    process.arch as ForgeArch,
    forgeConfig.electronRebuildConfig
  );

  await runHook(forgeConfig, 'generateAssets');

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
  if (spawnedPluginChild) return spawnedPluginChild;

  const spawnOpts = {
    cwd: dir,
    stdio: 'inherit',
    env: Object.assign({}, process.env, enableLogging ? {
      ELECTRON_ENABLE_LOGGING: true,
      ELECTRON_ENABLE_STACK_DUMPING: true,
    } : {}) as NodeJS.ProcessEnv,
  };

  if (runAsNode) {
    spawnOpts.env.ELECTRON_RUN_AS_NODE = 'true';
  } else {
    delete spawnOpts.env.ELECTRON_RUN_AS_NODE;
  }

  if (inspect) {
    args = ['--inspect'].concat(args);
  }

  let spawned!: ChildProcess;

  await asyncOra('Launching Application', async () => {
    spawned = spawn(process.execPath, [path.resolve(dir, 'node_modules/electron/cli'), appPath].concat(args), spawnOpts);
  });

  return spawned;
};
