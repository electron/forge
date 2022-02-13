import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import { yarnOrNpmSpawn } from '../util/yarn-or-npm';

import resolveDir from '../util/resolve-dir';

const d = debug('electron-forge:lint');

export interface LintOptions {
  dir?: string;
  interactive?: boolean;
}

export default async ({ dir = process.cwd(), interactive = false }: LintOptions): Promise<void> => {
  asyncOra.interactive = interactive;

  let success = true;
  let result = null;

  await asyncOra('Linting Application', async (lintSpinner) => {
    const resolvedDir = await resolveDir(dir);
    if (!resolvedDir) {
      throw new Error('Failed to locate lintable Electron application');
    }

    dir = resolvedDir;

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
