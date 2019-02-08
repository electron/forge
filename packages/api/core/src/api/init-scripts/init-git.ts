import { asyncOra } from '@electron-forge/async-ora';
import { exec } from 'child_process';
import debug from 'debug';

const d = debug('electron-forge:init:git');

export default async (dir: string) => {
  await asyncOra('Initializing Git Repository', async () => {
    await new Promise((resolve, reject) => {
      exec('git rev-parse --show-toplevel', {
        cwd: dir,
      }, (err) => {
        if (err) {
          // not run within a Git repository
          d('executing "git init" in directory:', dir);
          exec('git init', {
            cwd: dir,
          }, (err) => {
            if (err) return reject(err);
            resolve();
          });
        } else {
          d('.git directory already exists, skipping git initialization');
          resolve();
        }
      });
    });
  });
};
