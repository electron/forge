import 'colors';
import debug from 'debug';
import { yarnOrNpmSpawn } from '../util/yarn-or-npm';

import asyncOra from '../util/ora-handler';
import resolveDir from '../util/resolve-dir';

const d = debug('electron-forge:lint');

/**
 * @typedef {Object} LintOptions
 * @property {string} [dir=process.cwd()] The path to the module to import
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 */

/**
 * Lint a local Electron application.
 *
 * The promise will be rejected with the stdout+stderr of the linting process if linting fails or
 * will be resolved if it succeeds.
 *
 * @param {LintOptions} providedOptions - Options for the Lint method
 * @return {Promise<null, string>} Will resolve when the lint process is complete
 */
export default async (providedOptions = {}) => {
  // eslint-disable-next-line prefer-const, no-unused-vars
  let { dir, interactive } = Object.assign({
    dir: process.cwd(),
    interactive: false,
  }, providedOptions);
  asyncOra.interactive = interactive;

  let success = true;
  let result = null;

  await asyncOra('Linting Application', async (lintSpinner) => {
    dir = await resolveDir(dir);
    if (!dir) {
      throw 'Failed to locate lintable Electron application';
    }

    d('executing "run lint" in dir:', dir);
    try {
      await yarnOrNpmSpawn(['run', 'lint'], {
        stdio: process.platform === 'win32' ? 'inherit' : 'pipe',
        cwd: dir,
      });
    } catch (err) {
      lintSpinner.fail();
      success = false;
      result = err;
    }
  });

  if (!success) {
    throw result;
  }
};
