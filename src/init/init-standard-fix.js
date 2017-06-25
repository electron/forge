import debug from 'debug';
import { yarnOrNpmSpawn } from '../util/yarn-or-npm';

import asyncOra from '../util/ora-handler';

const d = debug('electron-forge:init:standard-fix');

const run = async (dir) => {
  try {
    await yarnOrNpmSpawn(['run', 'lint', '--', '--fix'], {
      stdio: 'inherit',
      cwd: dir,
    });
  } catch (err) {
    throw new Error(`Failed to fix JS to standard style (${err.message})`);
  }
};

export default async (dir) => {
  await asyncOra('Applying Standard Style to JS', async () => {
    d('executing "standard --fix" in:', dir);
    await run(dir);
  });
};
