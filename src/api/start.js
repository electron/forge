import 'colors';
import { spawn } from 'child_process';
import path from 'path';

import asyncOra from '../util/ora-handler';
import readPackageJSON from '../util/read-package-json';
import rebuild from '../util/rebuild';
import resolveDir from '../util/resolve-dir';

/**
 * @typedef {Object} StartOptions
 * @property {string} [dir=process.cwd()] The path to the app to be run
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
  let { dir, interactive, enableLogging, args } = Object.assign({
    dir: process.cwd(),
    interactive: false,
    enableLogging: false,
    args: [],
  }, providedOptions);
  asyncOra.interactive = interactive;

  await asyncOra('Locating Application', async () => {
    dir = await resolveDir(dir);
    if (!dir) {
      throw 'Failed to locate startable Electron application';
    }
  });

  const packageJSON = await readPackageJSON(dir);

  await rebuild(dir, packageJSON.devDependencies['electron-prebuilt-compile'], process.platform, process.arch);

  const spawnOpts = {
    cwd: dir,
    stdio: 'inherit',
    env: Object.assign({}, process.env, enableLogging ? {
      ELECTRON_ENABLE_LOGGING: true,
      ELECTRON_ENABLE_STACK_DUMPING: true,
    } : {}),
  };

  let spawned;

  await asyncOra('Launching Application', async () => {
    /* istanbul ignore if  */
    if (process.platform === 'win32') {
      spawned = spawn(path.resolve(dir, 'node_modules/.bin/electron.cmd'), ['.'].concat(args), spawnOpts);
    } else {
      spawned = spawn(path.resolve(dir, 'node_modules/.bin/electron'), ['.'].concat(args), spawnOpts);
    }
  });

  return spawned;
};
