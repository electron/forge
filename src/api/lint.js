import 'colors';
import debug from 'debug';
import { spawn as yarnOrNPMSpawn } from 'yarn-or-npm';

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
      // eslint-disable-next-line no-throw-literal
      throw 'Failed to locate lintable Electron application';
    }

    d('executing "run lint -- --color" in dir:', dir);
    const child = yarnOrNPMSpawn(['run', 'lint', '--', '--color'], {
      stdio: process.platform === 'win32' ? 'inherit' : 'pipe',
      cwd: dir,
    });
    const output = [];
    if (process.platform !== 'win32') {
      child.stdout.on('data', data => output.push(data.toString()));
      child.stderr.on('data', data => output.push(data.toString().red));
    }
    await new Promise((resolve) => {
      child.on('exit', (code) => {
        if (code !== 0) {
          success = false;
          lintSpinner.fail();
          if (interactive) {
            output.forEach(data => process.stdout.write(data));
            process.exit(code);
          } else {
            result = output.join('');
          }
        }
        resolve();
      });
    });
  });

  if (!success) {
    throw result;
  }
};
