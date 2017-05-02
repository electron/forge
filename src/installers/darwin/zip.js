import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import moveApp from '../../util/move-app';

export default async (filePath, installSpinner) => {
  await new Promise((resolve) => {
    const child = spawn('unzip', ['-q', '-o', path.basename(filePath)], {
      cwd: path.dirname(filePath),
    });
    child.stdout.on('data', () => {});
    child.stderr.on('data', () => {});
    child.on('exit', () => resolve());
  });

  const appPath = (await fs.readdir(path.dirname(filePath))).filter(file => file.endsWith('.app'))
    .map(file => path.resolve(path.dirname(filePath), file))
    .sort((fA, fB) => fs.statSync(fA).ctime.getTime() - fs.statSync(fB).ctime.getTime())[0];

  const targetApplicationPath = `/Applications/${path.basename(appPath)}`;

  await moveApp(appPath, targetApplicationPath, installSpinner);

  spawn('open', ['-R', targetApplicationPath], { detached: true });
};
