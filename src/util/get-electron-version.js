import debug from 'debug';
import path from 'path';
import readPackageJSON from './read-package-json';

const d = debug('electron-forge:util');

export default async (projectDir) => {
  let result = null;

  const modulesToExamine = ['electron-prebuilt-compile', 'electron-compile', 'electron'];
  for (let i = 0; i < modulesToExamine.length; i += 1) {
    const moduleName = modulesToExamine[i];
    const moduleDir = path.join(projectDir, 'node_modules', moduleName);
    try {
      const packageJSON = await readPackageJSON(moduleDir);
      result = packageJSON.version;
      break;
    } catch (e) {
      d(`Could not read package.json for moduleName=${moduleName}`);
    }
  }

  if (!result) {
    d(`getElectronVersion failed to determine electron version: projectDir=${projectDir}, result=${result}`);
  }

  return result;
};
