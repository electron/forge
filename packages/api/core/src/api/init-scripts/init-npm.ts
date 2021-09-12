import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';

import installDepList, { DepType, DepVersionRestriction } from '../../util/install-dependencies';

const d = debug('electron-forge:init:npm');
const corePackage = fs.readJsonSync(path.resolve(__dirname, '../../../package.json'));

export function siblingDep(name: string): string {
  return `@electron-forge/${name}@^${corePackage.version}`;
}

export const deps = ['electron-squirrel-startup'];
export const devDeps = [siblingDep('cli'), siblingDep('maker-squirrel'), siblingDep('maker-zip'), siblingDep('maker-deb'), siblingDep('maker-rpm')];
export const exactDevDeps = ['electron'];

export default async (dir: string): Promise<void> => {
  await asyncOra('Installing NPM Dependencies', async () => {
    d('installing dependencies');
    await installDepList(dir, deps);

    d('installing devDependencies');
    await installDepList(dir, devDeps, DepType.DEV);

    d('installing exact devDependencies');
    for (const packageName of exactDevDeps) {
      await installDepList(dir, [packageName], DepType.DEV, DepVersionRestriction.EXACT);
    }
  });
};
