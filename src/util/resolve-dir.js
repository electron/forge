import debug from 'debug';
import fs from 'fs-extra';
import isExactVersion from 'exact-version';
import path from 'path';
import readPackageJSON from './read-package-json';

const d = debug('electron-forge:project-resolver');

export default async (dir) => {
  let mDir = dir;
  let prevDir;
  while (prevDir !== mDir) {
    prevDir = mDir;
    const testPath = path.resolve(mDir, 'package.json');
    d('searching for project in:', mDir);
    if (await fs.pathExists(testPath)) {
      const packageJSON = await readPackageJSON(mDir);

      if (packageJSON.devDependencies && packageJSON.devDependencies['electron-prebuilt-compile']) {
        const version = packageJSON.devDependencies['electron-prebuilt-compile'];
        if (!isExactVersion(version)) {
          throw `You must depend on an EXACT version of "electron-prebuilt-compile" not a range (got "${version}")`;
        }
      } else {
        throw 'You must depend on "electron-prebuilt-compile" in your devDependencies';
      }

      if (packageJSON.config && packageJSON.config.forge) {
        d('electron-forge compatible package.json found in', testPath);
        return mDir;
      }
    }
    mDir = path.dirname(mDir);
  }
  return null;
};
