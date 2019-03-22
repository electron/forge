import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';
import logSymbols from 'log-symbols';

import { readRawPackageJson } from './read-package-json';
import { getElectronVersion } from './electron-version';
import { getAllDependencies } from './dependency-reader';

const d = debug('electron-forge:project-resolver');

const warnOnMismatchedForgeDependencies = async (projectDir: string) => {
  const pjPath = path.resolve(projectDir, 'package.json');
  const pj = await fs.readJson(pjPath);
  const versions: Record<string, string[]> = {};
  for (const dep of getAllDependencies(pj)) {
    if (!dep.name.startsWith('@electron-forge/')) continue;

    versions[dep.version] = versions[dep.version] || [];
    versions[dep.version].push(dep.name);
  }

  if (Object.keys(versions).length > 1) {
    console.warn(`
${logSymbols.warning} Your Electron Forge dependencies are not the same version, this can cause unexpected behavior \
or issues when packaging.  We HIGHLY reccomend that the version of your @electron-forge/* dependencies is the same.

${Object.keys(versions).map(version => `${version.cyan}\n${versions[version].map(name => ` * ${name}`).join('\n')}`).join('\n\n')}
`.yellow);
  }
};

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
      let electronVersion;
      try {
        electronVersion = await getElectronVersion(mDir, packageJSON);
      } catch (err) {
        lastError = err.message;
      }

      if (packageJSON.config && packageJSON.config.forge) {
        d('electron-forge compatible package.json found in', testPath);
        return mDir;
      }

      if (await fs.pathExists(path.resolve(mDir, 'forge.config.js'))) {
        d('electron-forge config found in', mDir);
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
