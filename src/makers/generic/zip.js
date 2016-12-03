import { spawn } from 'child_process';
import fs from 'fs-promise';
import mkdirp from 'mkdirp';
import ora from 'ora';
import path from 'path';
import pify from 'pify';
import rimraf from 'rimraf';
import zipFolder from 'zip-folder';

const zipPromise = (from, to) =>
  new Promise((resolve, reject) => {
    const child = spawn('zip', ['-r', '-y', to, from]);

    child.stdout.on('data', () => {});
    child.stderr.on('data', () => {});

    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`Failed to zip, exitted with code: ${code}`));
    });
  });

export default async (dir, appName, forgeConfig) => {
  const zipPath = path.resolve(dir, '../make', `${path.basename(dir)}.zip`);
  await pify(mkdirp)(path.dirname(zipPath));
  if (await fs.exists(zipPath)) {
    await pify(rimraf)(zipPath);
  }
  switch (process.platform) {
    case 'win32':
      await pify(zipFolder)(dir, zipPath);
      break;
    case 'darwin':
      await zipPromise(path.resolve(dir, `${appName}.app`), zipPath);
      break;
    case 'linux':
      await zipPromise(dir, zipPath);
      break;
  }
}
