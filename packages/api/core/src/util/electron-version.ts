import debug from 'debug';
import findUp from 'find-up';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';
import yarnOrNpm, { hasYarn } from './yarn-or-npm';

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

async function findAncestorNodeModulesPath(
  dir: string,
  packageName: string,
): Promise<string | undefined> {
  if (hasYarn()) {
    const yarnLockPath = await findUp('yarn.lock', { cwd: dir, type: 'file' });
    if (yarnLockPath) {
      const nodeModulesPath = path.join(path.dirname(yarnLockPath), 'node_modules', packageName);
      if (await fs.pathExists(nodeModulesPath)) {
        return nodeModulesPath;
      }
    }
  }

  return Promise.resolve(undefined);
}

async function determineNodeModulesPath(
  dir: string,
  packageName: string,
): Promise<string | undefined> {
  const nodeModulesPath: string | undefined = path.join(dir, 'node_modules', packageName);
  if (await fs.pathExists(nodeModulesPath)) {
    return nodeModulesPath;
  }
  return findAncestorNodeModulesPath(dir, packageName);
}

export class PackageNotFoundError extends Error {
  constructor(packageName: string, dir: string) {
    super(`Cannot find the package "${packageName}". Perhaps you need to run "${yarnOrNpm()} install" in "${dir}"?`);
  }
}

function getElectronModuleName(packageJSON: any): string {
  if (!packageJSON.devDependencies) {
    throw new Error('package.json for app does not have any devDependencies');
  }

  const packageName = electronPackageNames.find((pkg) => packageJSON.devDependencies[pkg]);
  if (packageName === undefined) {
    throw new Error('Could not find any Electron packages in devDependencies');
  }

  return packageName;
}

async function getElectronPackageJSONPath(
  dir: string,
  packageName: string,
): Promise<string | undefined> {
  const nodeModulesPath = await determineNodeModulesPath(dir, packageName);
  if (!nodeModulesPath) {
    throw new PackageNotFoundError(packageName, dir);
  }

  const electronPackageJSONPath = path.join(nodeModulesPath, 'package.json');
  if (await fs.pathExists(electronPackageJSONPath)) {
    return electronPackageJSONPath;
  }

  return undefined;
}

export async function getElectronModulePath(
  dir: string,
  packageJSON: any,
): Promise<string | undefined> {
  const moduleName = getElectronModuleName(packageJSON);
  const packageJSONPath = await getElectronPackageJSONPath(dir, moduleName);
  if (packageJSONPath) {
    return path.dirname(packageJSONPath);
  }

  return undefined;
}

export async function getElectronVersion(dir: string, packageJSON: any): Promise<string> {
  const packageName = getElectronModuleName(packageJSON);

  let version = packageJSON.devDependencies[packageName];
  if (!semver.valid(version)) { // It's not an exact version, find it in the actual module
    const electronPackageJSONPath = await getElectronPackageJSONPath(dir, packageName);
    if (electronPackageJSONPath) {
      const electronPackageJSON = await fs.readJson(electronPackageJSONPath);
      // eslint-disable-next-line prefer-destructuring
      version = electronPackageJSON.version;
    } else {
      throw new PackageNotFoundError(packageName, dir);
    }
  }

  return version;
}

export function updateElectronDependency(
  packageJSON: any,
  dev: string[],
  exact: string[],
): [string[], string[]] {
  const alteredDev = ([] as string[]).concat(dev);
  let alteredExact = ([] as string[]).concat(exact);
  if (Object.keys(packageJSON.devDependencies).find(findElectronDep)) {
    alteredExact = alteredExact.filter((dep) => dep !== 'electron');
  } else {
    const electronKey = Object.keys(packageJSON.dependencies).find(findElectronDep);
    if (electronKey) {
      alteredExact = alteredExact.filter((dep) => dep !== 'electron');
      d(`Moving ${electronKey} from dependencies to devDependencies`);
      alteredDev.push(`${electronKey}@${packageJSON.dependencies[electronKey]}`);
      delete packageJSON.dependencies[electronKey];
    }
  }

  return [alteredDev, alteredExact];
}
