import { exec } from 'child_process';
import debug from 'debug';
import ora from 'ora';

const d = debug('electron-forge:init:git');

export default async dir =>
  new Promise((resolve, reject) => {
    const spinner = ora.ora('Initializing Git Repository').start();
    d('executing "git init" in directory:', dir);
    exec('git init', {
      cwd: dir,
    }, (err) => {
      if (err) return spinner.fail() && reject(err);
      spinner.succeed();
      resolve();
    });
  });
