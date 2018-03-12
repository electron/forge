import debug from 'debug';
import path from 'path';
import readPackageJSON from './read-package-json';

const d = debug('electron-forge:util');

export default async (projectDir) => {
  let result = null;

  const modulesToExamine = ['electron-prebuilt-compile', 'electron', 'electron-prebuilt'];
  for (const moduleName of modulesToExamine) {
    const moduleDir = path.join(projectDir, 'node_modules', moduleName);
    try {
      const packageJSON = await readPackageJSON(moduleDir);
      result = packageJSON.version;
      break;
    } catch (e) {
      d(`Could not read package.json for moduleName=${moduleName}`, e);
    }
  }

  if (!result) {
    d(`getElectronVersion failed to determine Electron version: projectDir=${projectDir}, result=${result}`);
  }

  return result;
};
