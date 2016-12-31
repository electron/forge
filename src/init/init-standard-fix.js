import debug from 'debug';
import { spawn as yarnOrNPMSpawn } from 'yarn-or-npm';

import asyncOra from '../util/ora-handler';

const d = debug('electron-forge:init:standard-fix');

const run = dir =>
  new Promise((resolve, reject) => {
    const child = yarnOrNPMSpawn(['run', 'lint', '--', '--fix'], {
      stdio: 'inherit',
      cwd: dir,
    });

    child.on('exit', (code) => {
      if (code === 0) resolve();
      if (code !== 0) reject(new Error(`Failed to fix JS to standard style (${code})`));
    });
  });

export default async (dir) => {
  await asyncOra('Applying Standard Style to JS', async () => {
    d('executing "standard --fix" in:', dir);
    await run(dir);
  });
};
