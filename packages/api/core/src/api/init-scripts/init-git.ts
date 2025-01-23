import { exec } from 'node:child_process';

import debug from 'debug';

const d = debug('electron-forge:init:git');

export const initGit = async (dir: string): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    exec(
      'git rev-parse --show-toplevel',
      {
        cwd: dir,
      },
      (err) => {
        if (err) {
          // not run within a Git repository
          d('executing "git init" in directory:', dir);
          exec('git init', { cwd: dir }, (initErr) => (initErr ? reject(initErr) : resolve()));
        } else {
          d('.git directory already exists, skipping git initialization');
          resolve();
        }
      }
    );
  });
};
