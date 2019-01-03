import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';
import { readRawPackageJson } from './read-package-json';
import { getElectronVersion } from './electron-version';

const d = debug('electron-forge:project-resolver');

// FIXME: If we want getElectronVersion to be overridable by plugins
//        and / or forge config then we need to be able to resolve
//        the dir without calling getElectronVersion
export default async (dir: string) => {
  let mDir = dir;
  let bestGuessDir: string | null = null;
  let lastError: string | null = null;

  let prevDir;
  while (prevDir !== mDir) {
    prevDir = mDir;
    const testPath = path.resolve(mDir, 'package.json');
    d('searching for project in:', mDir);
    if (await fs.pathExists(testPath)) {
      const packageJSON = await readRawPackageJson(mDir);

      // TODO: Move this check to inside the forge config resolver and use
      //       mutatedPackageJson reader
      const electronVersion = getElectronVersion(packageJSON);
      if (electronVersion) {
        if (!/[0-9]/.test(electronVersion[0])) {
          lastError = `You must depend on an EXACT version of electron not a range (${electronVersion})`;
        }
      } else {
        lastError = 'You must depend on "electron" in your devDependencies';
      }

      if (packageJSON.config && packageJSON.config.forge) {
        d('electron-forge compatible package.json found in', testPath);
        return mDir;
      }

      bestGuessDir = mDir;
    }
    mDir = path.dirname(mDir);
  }
  if (bestGuessDir) {
    d('guessing on the best electron-forge package.json found in', bestGuessDir);
    return bestGuessDir;
  }
  if (lastError) {
    throw lastError;
  }
  return null;
};
