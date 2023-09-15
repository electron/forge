import path from 'path';

import { getPackageManager } from '@electron-forge/core-utils';
import { ForgeListrTask } from '@electron-forge/shared-types';
import debug from 'debug';
import fs from 'fs-extra';

import installDepList, { DepType, DepVersionRestriction, getInstallDevDepsOption, getInstallExactDepsOption } from '../../util/install-dependencies';

const d = debug('electron-forge:init:npm');
const corePackage = fs.readJsonSync(path.resolve(__dirname, '../../../package.json'));

export function siblingDep(name: string): string {
  return `@electron-forge/${name}@^${corePackage.version}`;
}

export const deps = ['electron-squirrel-startup'];
export const devDeps = [
  siblingDep('cli'),
  siblingDep('maker-squirrel'),
  siblingDep('maker-zip'),
  siblingDep('maker-deb'),
  siblingDep('maker-rpm'),
  siblingDep('plugin-auto-unpack-natives'),
];
export const exactDevDeps = ['electron'];

export const initNPM = async <T>(dir: string, task: ForgeListrTask<T>): Promise<void> => {
  d('installing dependencies');
  const packageManager = getPackageManager();
  task.output = `${packageManager} add ${deps.join(' ')}`;
  await installDepList(dir, deps);

  d('installing devDependencies');
  task.output = `${packageManager} add ${getInstallDevDepsOption()} ${deps.join(' ')}`;
  await installDepList(dir, devDeps, DepType.DEV);

  d('installing exact devDependencies');
  for (const packageName of exactDevDeps) {
    task.output = `${packageManager} add ${getInstallDevDepsOption()} ${getInstallExactDepsOption()} ${packageName}`;
    await installDepList(dir, [packageName], DepType.DEV, DepVersionRestriction.EXACT);
  }
};
