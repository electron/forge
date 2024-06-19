import path from 'path';

import debug from 'debug';
import fs from 'fs-extra';
import semver from 'semver';

import { safeYarnOrNpm } from './yarn-or-npm';

const d = debug('electron-forge:electron-version');

const electronPackageNames = ['electron-nightly', 'electron'];

type PackageJSONWithDeps = {
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
};

function findElectronDep(dep: string): boolean {
  return electronPackageNames.includes(dep);
}

export class PackageNotFoundError extends Error {
  constructor(packageName: string, dir: string) {
    super(`Cannot find the package "${packageName}". Perhaps you need to run "${safeYarnOrNpm()} install" in "${dir}"?`);
  }
}

function getElectronModuleName(packageJSON: PackageJSONWithDeps): string {
  if (!packageJSON.devDependencies) {
    throw new Error('package.json for app does not have any devDependencies');
  }

  // Why: checked above
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const packageName = electronPackageNames.find((pkg) => packageJSON.devDependencies![pkg]);
  if (packageName === undefined) {
    throw new Error('Could not find any Electron packages in devDependencies');
  }

  return packageName;
}

function getElectronPackageJSONPath(dir: string, packageName: string): string {
  if (packageName) {
    try {
      // eslint-disable-next-line node/no-missing-require
      return require.resolve(`${packageName}/package.json`, { paths: [dir] });
    } catch {
      // Ignore
    }
  }
  throw new PackageNotFoundError(packageName, dir);
}

export function getElectronModulePath(dir: string, packageJSON: PackageJSONWithDeps): string | undefined {
  const moduleName = getElectronModuleName(packageJSON);
  const packageJSONPath = getElectronPackageJSONPath(dir, moduleName);
  if (packageJSONPath) {
    return path.dirname(packageJSONPath);
  }

  return undefined;
}

export async function getElectronVersion(dir: string, packageJSON: PackageJSONWithDeps): Promise<string> {
  const packageName = getElectronModuleName(packageJSON);

  // Why: checked in getElectronModuleName
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let version = packageJSON.devDependencies![packageName];
  if (!semver.valid(version)) {
    // It's not an exact version, find it in the actual module
    const electronPackageJSONPath = getElectronPackageJSONPath(dir, packageName);
    if (electronPackageJSONPath) {
      const electronPackageJSON = await fs.readJson(electronPackageJSONPath);
      version = electronPackageJSON.version;
    } else {
      throw new PackageNotFoundError(packageName, dir);
    }
  }

  return version;
}

export function updateElectronDependency(packageJSON: PackageJSONWithDeps, dev: string[], exact: string[]): [string[], string[]] {
  const alteredDev = ([] as string[]).concat(dev);
  let alteredExact = ([] as string[]).concat(exact);
  // Why: checked in getElectronModuleName
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (Object.keys(packageJSON.devDependencies!).find(findElectronDep)) {
    alteredExact = alteredExact.filter((dep) => dep !== 'electron');
  } else if (packageJSON.dependencies) {
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
