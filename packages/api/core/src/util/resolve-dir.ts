import path from 'node:path';

import { getElectronVersion } from '@electron-forge/core-utils';
import debug from 'debug';
import fs from 'fs-extra';

import { registeredForgeConfigs } from './forge-config';
import { readRawPackageJson } from './read-package-json';

const d = debug('electron-forge:project-resolver');

// FIXME: If we want getElectronVersion to be overridable by plugins
//        and / or forge config then we need to be able to resolve
//        the dir without calling getElectronVersion
export default async (dir: string): Promise<string | null> => {
  let mDir = path.resolve(dir);
  let bestGuessDir: string | null = null;
  let lastError: string | null = null;

  let prevDir;
  while (prevDir !== mDir) {
    prevDir = mDir;
    d('searching for project in:', mDir);
    if (registeredForgeConfigs.has(mDir)) {
      d('virtual config found in:', mDir);
      return mDir;
    }
    const testPath = path.resolve(mDir, 'package.json');
    if (await fs.pathExists(testPath)) {
      const packageJSON = await readRawPackageJson(mDir);

      // TODO: Move this check to inside the forge config resolver and use
      //       mutatedPackageJson reader
      try {
        await getElectronVersion(mDir, packageJSON);
      } catch (err) {
        if (err instanceof Error) {
          lastError = err.message;
        }
      }

      if (packageJSON.config && packageJSON.config.forge) {
        d('electron-forge compatible package.json found in', testPath);
        return mDir;
      }

      if (packageJSON.devDependencies?.['@electron-forge/cli'] || packageJSON.devDependencies?.['@electron-forge/core']) {
        d('package.json with forge dependency found in', testPath);
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
    throw new Error(lastError);
  }
  return null;
};
