import path from 'node:path';

import { PMDetails } from '@electron-forge/core-utils';
import { ForgeListrTask } from '@electron-forge/shared-types';
import debug from 'debug';
import fs from 'fs-extra';
import semver from 'semver';

import {
  DepType,
  DepVersionRestriction,
  installDependencies,
} from '../../util/install-dependencies';

const d = debug('electron-forge:init:npm');
const corePackage = fs.readJsonSync(
  path.resolve(__dirname, '../../../package.json'),
);

export function siblingDep(name: string): string {
  return `@electron-forge/${name}@^${corePackage.version}`;
}

export const deps = ['electron-squirrel-startup'];
export const devDeps = [
  '@electron/fuses@^1.0.0',
  siblingDep('cli'),
  siblingDep('maker-squirrel'),
  siblingDep('maker-zip'),
  siblingDep('maker-deb'),
  siblingDep('maker-rpm'),
  siblingDep('plugin-auto-unpack-natives'),
  siblingDep('plugin-fuses'),
];
export const exactDevDeps = ['electron'];

export const initNPM = async <T>(
  pm: PMDetails,
  dir: string,
  electronVersion: string,
  task: ForgeListrTask<T>,
): Promise<void> => {
  d('installing dependencies');
  task.output = `${pm.executable} ${pm.install} ${deps.join(' ')}`;
  await installDependencies(pm, dir, deps);

  d(`installing devDependencies`);
  task.output = `${pm.executable} ${pm.install} ${pm.dev} ${devDeps.join(' ')}`;
  await installDependencies(pm, dir, devDeps, DepType.DEV);

  d('installing exact devDependencies');
  for (const packageName of exactDevDeps) {
    let packageInstallString = packageName;
    if (packageName === 'electron') {
      if (electronVersion === 'nightly') {
        packageInstallString = `electron-nightly@latest`;
      } else if (semver.prerelease(electronVersion)?.includes('nightly')) {
        packageInstallString = `electron-nightly@${electronVersion}`;
      } else {
        packageInstallString += `@${electronVersion}`;
      }
    }
    task.output = `${pm.executable} ${pm.install} ${pm.dev} ${pm.exact} ${packageInstallString}`;
    await installDependencies(
      pm,
      dir,
      [packageInstallString],
      DepType.DEV,
      DepVersionRestriction.EXACT,
    );
  }
};
