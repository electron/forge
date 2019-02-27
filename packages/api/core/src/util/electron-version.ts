import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';
import yarnOrNpm from './yarn-or-npm';

const d = debug('electron-forge:electron-version');

const electronPackageNames = [
  'electron-prebuilt-compile',
  'electron-prebuilt',
  'electron-nightly',
  'electron',
];

function findElectronDep(dep: string): boolean {
  return electronPackageNames.includes(dep);
}

export async function getElectronVersion(dir: string, packageJSON: any): Promise<string> {
  if (!packageJSON.devDependencies) {
    throw new Error('package.json for app does not have any devDependencies'.red);
  }
  const packageName = electronPackageNames.find(pkg => packageJSON.devDependencies[pkg]);
  if (packageName === undefined) {
    throw new Error('Could not find any Electron packages in devDependencies');
  }

  let version = packageJSON.devDependencies[packageName];
  if (!semver.valid(version)) {
    // It's not an exact version, find it in the actual module
    const electronPackageJSONPath = path.join(dir, 'node_modules', packageName, 'package.json');
    if (await fs.pathExists(electronPackageJSONPath)) {
      const electronPackageJSON = await fs.readJson(electronPackageJSONPath);
      version = electronPackageJSON.version;
    } else {
      throw new Error(`Cannot find the package "${packageName}". Perhaps you need to run "${yarnOrNpm()} install" in "${dir}"?`);
    }
  }

  return version;
}

export function updateElectronDependency(packageJSON: any, dev: string[], exact: string[]): [string[], string[]] {
  const alteredDev = ([] as string[]).concat(dev);
  let alteredExact = ([] as string[]).concat(exact);
  if (Object.keys(packageJSON.devDependencies).find(findElectronDep)) {
    alteredExact = alteredExact.filter(dep => dep !== 'electron');
  } else {
    const electronKey = Object.keys(packageJSON.dependencies).find(findElectronDep);
    if (electronKey) {
      alteredExact = alteredExact.filter(dep => dep !== 'electron');
      d(`Moving ${electronKey} from dependencies to devDependencies`);
      alteredDev.push(`${electronKey}@${packageJSON.dependencies[electronKey]}`);
      delete packageJSON.dependencies[electronKey];
    }
  }

  return [alteredDev, alteredExact];
}
