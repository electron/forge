import path from 'node:path';

import { PMDetails } from '@electron-forge/core-utils';
import { ForgeListrTask } from '@electron-forge/shared-types';
import debug from 'debug';
import fs from 'fs-extra';

import installDepList, { DepType, DepVersionRestriction } from '../../util/install-dependencies';

const d = debug('electron-forge:init:npm');
const corePackage = fs.readJsonSync(path.resolve(__dirname, '../../../package.json'));

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

export const initNPM = async <T>(pm: PMDetails, dir: string, task: ForgeListrTask<T>): Promise<void> => {
  d('installing dependencies');
  task.output = `${pm.executable} ${pm.install} ${deps.join(' ')}`;
  await installDepList(pm, dir, deps);

  d('installing devDependencies');
  task.output = `${pm.executable} ${pm.install} ${pm.dev} ${deps.join(' ')}`;
  await installDepList(pm, dir, devDeps, DepType.DEV);

  d('installing exact devDependencies');
  for (const packageName of exactDevDeps) {
    task.output = `${pm.executable} ${pm.install} ${pm.dev} ${pm.exact} ${packageName}`;
    await installDepList(pm, dir, [packageName], DepType.DEV, DepVersionRestriction.EXACT);
  }
};
