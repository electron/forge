import { spawn } from 'child_process';
import fs from 'fs-promise';
import ora from 'ora';
import path from 'path';
import username from 'username';

export default async (dir) => {
  const initSpinner = ora('Initializing NPM Module').start();
  const packageJSON = JSON.parse(await fs.readFile(path.resolve(__dirname, '../../tmpl/package.json'), 'utf8'));
  packageJSON.productName = packageJSON.name = path.basename(dir).toLowerCase();
  packageJSON.author = await username();
  await fs.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON, null, 4));
  initSpinner.succeed();
  const installSpinner = ora('Installing NPM Dependencies').start();
  return new Promise((resolve, reject) => {
    const child = spawn(`${process.platform === 'win32' ? 'npm.cmd' : 'npm'}`, ['install'], {
      cwd: dir,
    });
    child.on('exit', (code) => {
      if (code !== 0) return installSpinner.fail() && reject(code);
      installSpinner.succeed();
      resolve();
    });
  });
};
