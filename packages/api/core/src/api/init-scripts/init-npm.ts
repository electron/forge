import path from 'path';

import { safeYarnOrNpm, yarnOrNpmSpawn } from '@electron-forge/core-utils';
import { ForgeListrTask } from '@electron-forge/shared-types';
import debug from 'debug';
import fs from 'fs-extra';

import installDepList, { DepType, DepVersionRestriction } from '../../util/install-dependencies';
import { readRawPackageJson } from '../../util/read-package-json';

const d = debug('electron-forge:init:npm');
const corePackage = fs.readJsonSync(path.resolve(__dirname, '../../../package.json'));

export function siblingDep(name: string): string {
  return `@electron-forge/${name}@^${corePackage.version}`;
}

export const deps = ['electron-squirrel-startup'];
export const devDeps = [siblingDep('cli'), siblingDep('maker-squirrel'), siblingDep('maker-zip'), siblingDep('maker-deb'), siblingDep('maker-rpm')];
export const exactDevDeps = ['electron'];

export const initNPM = async (dir: string, task: ForgeListrTask<any>): Promise<void> => {
  d('installing dependencies');
  const packageManager = safeYarnOrNpm();
  task.output = `${packageManager} install ${deps.join(' ')}`;
  await installDepList(dir, deps);

  d('installing devDependencies');
  task.output = `${packageManager} install --dev ${deps.join(' ')}`;
  await installDepList(dir, devDeps, DepType.DEV);

  d('installing exact devDependencies');
  for (const packageName of exactDevDeps) {
    task.output = `${packageManager} install --dev --exact ${packageName}`;
    await installDepList(dir, [packageName], DepType.DEV, DepVersionRestriction.EXACT);
  }

  // This logic allows developers working on forge itself to easily init
  // a local template and have it use their local plugins / core / cli packages
  if (process.env.LINK_FORGE_DEPENDENCIES_ON_INIT) {
    const packageJson = await readRawPackageJson(dir);
    const linkFolder = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', '.links');
    for (const packageName of Object.keys(packageJson.devDependencies)) {
      if (packageName.startsWith('@electron-forge/')) {
        task.output = `${packageManager} link --link-folder ${linkFolder} ${packageName}`;
        await yarnOrNpmSpawn(['link', '--link-folder', linkFolder, packageName], {
          cwd: dir,
        });
      }
    }
  }
};
