import MakerBase from '@electron-forge/maker-base';

import { spawn } from 'child_process';
import path from 'path';
import pify from 'pify';

export default class MakerZIP extends MakerBase {
  name = 'zip';

  isSupportedOnCurrentPlatform() {
    return true;
  }

  async make({
    dir,
    makeDir,
    appName,
    packageJSON,
    targetPlatform,
  }) {
    const zipFolder = require('zip-folder');

    const zipPath = path.resolve(makeDir, `${path.basename(dir)}-${packageJSON.version}.zip`);
    await this.ensureFile(zipPath);
    switch (targetPlatform) {
      case 'win32':
        await pify(zipFolder)(dir, zipPath);
        break;
      case 'mas':
      case 'darwin':
        await this.zipPromise(path.resolve(dir, `${appName}.app`), zipPath);
        break;
      case 'linux':
        await this.zipPromise(dir, zipPath);
        break;
      default:
        throw `Unrecognized platform: ${process.platform}`;
    }
    return [zipPath];
  }

  zipPromise = (from, to) =>
    new Promise((resolve, reject) => {
      const child = spawn('zip', ['-r', '-y', to, path.basename(from)], {
        cwd: path.dirname(from),
      });

      child.stdout.on('data', () => {});
      child.stderr.on('data', () => {});

      child.on('close', (code) => {
        if (code === 0) return resolve();
        reject(new Error(`Failed to zip, exitted with code: ${code}`));
      });
    });
}
