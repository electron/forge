import { asyncOra } from '@electron-forge/async-ora';
import { exec } from 'child_process';
import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';

const d = debug('electron-forge:init:git');

export default async (dir: string) => {
  await asyncOra('Initializing Git Repository', async () => {
    await new Promise(async (resolve, reject) => {
      if (await fs.pathExists(path.resolve(dir, '.git'))) {
        d('.git directory already exists, skipping git initialization');
        return resolve();
      }
      d('executing "git init" in directory:', dir);
      exec('git init', {
        cwd: dir,
      }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};
