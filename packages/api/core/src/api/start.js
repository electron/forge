import 'colors';
import { asyncOra } from '@electron-forge/async-ora';
import { spawn } from 'child_process';
import path from 'path';

import readPackageJSON from '../util/read-package-json';
import rebuild from '../util/rebuild';
import resolveDir from '../util/resolve-dir';
import getForgeConfig from '../util/forge-config';
import runHook from '../util/hook';
import getElectronVersion from '../util/electron-version';

/**
 * @typedef {Object} StartOptions
 * @property {string} [dir=process.cwd()] The path to the electron forge project to run
 * @property {string} [appPath='.'] The path (relative to dir) to the electron app to run relative to the project directory
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {boolean} [enableLogging=false] Enables advanced internal Electron debug calls
 * @property {Array<string>} [args] Arguments to pass through to the launched Electron application
 */

/**
 * Start an Electron application.
 *
 * @param {StartOptions} providedOptions - Options for the Publish method
 * @return {Promise} Will resolve when the application is launched
 */
export default async (providedOptions = {}) => {
  // eslint-disable-next-line prefer-const, no-unused-vars
  let { dir, interactive, enableLogging, appPath, args, runAsNode, inspect } = Object.assign({
    dir: process.cwd(),
    appPath: '.',
    interactive: false,
    enableLogging: false,
    args: [],
    runAsNode: false,
    inspect: false,
  }, providedOptions);
  asyncOra.interactive = interactive;

  await asyncOra('Locating Application', async () => {
    dir = await resolveDir(dir);
    if (!dir) {
      throw 'Failed to locate startable Electron application';
    }
  });

  const packageJSON = await readPackageJSON(dir);

  if (!packageJSON.version) {
    throw `Please set your application's 'version' in '${dir}/package.json'.`;
  }

  const forgeConfig = await getForgeConfig(dir);

  await rebuild(dir, getElectronVersion(packageJSON), process.platform, process.arch, forgeConfig.electronRebuildConfig);

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
    } : {}),
  };

  if (runAsNode) {
    spawnOpts.env.ELECTRON_RUN_AS_NODE = true;
  } else {
    delete spawnOpts.env.ELECTRON_RUN_AS_NODE;
  }

  if (inspect) {
    args = ['--inspect'].concat(args);
  }

  let spawned;

  await asyncOra('Launching Application', async () => {
    spawned = spawn(process.execPath, [path.resolve(dir, 'node_modules/electron/cli'), appPath].concat(args), spawnOpts);
  });

  return spawned;
};
