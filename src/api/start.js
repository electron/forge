import 'colors';
import { spawn } from 'child_process';
import path from 'path';

import asyncOra from '../util/ora-handler';
import readPackageJSON from '../util/read-package-json';
import rebuild from '../util/rebuild';
import resolveDir from '../util/resolve-dir';

/**
 * @typedef {Object} StartOptions
 * @property {string} [dir=process.cwd()] The path to the module to publish
 * @property {boolean} [interactive=false] Boolean, whether to use sensible defaults or prompt the user visually
 * @property {boolean} [enableLogging=false] Enables advanced internal Electron debug calls
 * @property {Array<string>} [args] Arguments to pass through to the launched Electron application
 */

/**
 * Starts an Electron application
 *
 * @param {StartOptions} options - Options for the Publish method
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

  await asyncOra('Locating Application', async () => {
    dir = await resolveDir(dir);
    if (!dir) {
      // eslint-disable-next-line no-throw-literal
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
  await asyncOra('Launching Application', async () => {
    if (process.platform === 'win32') {
      spawn(path.resolve(dir, 'node_modules/.bin/electron.cmd'), ['.'].concat(args), spawnOpts);
    } else {
      spawn(path.resolve(dir, 'node_modules/.bin/electron'), ['.'].concat(args), spawnOpts);
    }
  });
};
