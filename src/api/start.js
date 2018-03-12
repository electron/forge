import 'colors';
import { spawn } from 'child_process';
import path from 'path';

import asyncOra from '../util/ora-handler';
import getElectronVersion from '../util/get-electron-version';
import readPackageJSON from '../util/read-package-json';
import rebuild from '../util/rebuild';
import resolveDir from '../util/resolve-dir';
import getForgeConfig from '../util/forge-config';
import runHook from '../util/hook';

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
  const electronVersion = getElectronVersion(packageJSON);

  await rebuild(dir, electronVersion, process.platform, process.arch, forgeConfig.electronRebuildConfig);

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

  await runHook(forgeConfig, 'generateAssets');

  await asyncOra('Launching Application', async () => {
    spawned = spawn(process.execPath, [path.resolve(dir, 'node_modules/electron-prebuilt-compile/lib/cli'), appPath].concat(args), spawnOpts);
  });

  return spawned;
};
