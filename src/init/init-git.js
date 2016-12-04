import { exec } from 'child_process';
import debug from 'debug';
import fs from 'fs-promise';
import ora from 'ora';
import path from 'path';

const d = debug('electron-forge:init:git');

export default async dir =>
  new Promise(async (resolve, reject) => {
    const spinner = ora.ora('Initializing Git Repository').start();
    if (await fs.exists(path.resolve(dir, '.git'))) {
      d('.git directory already exists, skipping git initialization');
      spinner.succeed();
      return resolve();
    }
    d('executing "git init" in directory:', dir);
    exec('git init', {
      cwd: dir,
    }, (err) => {
      if (err) return spinner.fail() && reject(err);
      spinner.succeed();
      resolve();
    });
  });
