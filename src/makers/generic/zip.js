import { spawn } from 'child_process';
import debug from 'debug';
import path from 'path';
import pify from 'pify';
import zipFolder from 'zip-folder';

import { ensureFile } from '../../util/ensure-output';

const d = debug('electron-forge:make:zip');

const zipPromise = (from, to) =>
  new Promise((resolve, reject) => {
    const zipArgs = ['-r', '-y', to, path.basename(from)];
    d('spawning "zip" with args', zipArgs);
    const child = spawn('zip', zipArgs, {
      cwd: path.dirname(from),
    });

    child.stdout.on('data', () => {});
    child.stderr.on('data', () => {});

    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`Failed to zip, exitted with code: ${code}`));
    });
  });

export default async (dir, appName, targetArch, forgeConfig, packageJSON) => { // eslint-disable-line
  const zipPath = path.resolve(dir, '../make', `${path.basename(dir)}.zip`);
  await ensureFile(zipPath);
  switch (process.platform) {
    case 'win32':
      d('calling zip-folder on directory:', zipPath);
      await pify(zipFolder)(dir, zipPath);
      break;
    case 'darwin':
      await zipPromise(path.resolve(dir, `${appName}.app`), zipPath);
      break;
    case 'linux':
      await zipPromise(dir, zipPath);
      break;
    default:
      throw new Error('Unrecognized platform');
  }
  return [zipPath];
};
