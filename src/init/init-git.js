import { exec } from 'child_process';
import ora from 'ora';

export default async dir =>
  new Promise((resolve, reject) => {
    const spinner = ora('Initializing Git Repository').start();
    exec('git init', {
      cwd: dir,
    }, (err) => {
      if (err) return spinner.fail() && reject(err);
      spinner.succeed();
      resolve();
    });
  });
