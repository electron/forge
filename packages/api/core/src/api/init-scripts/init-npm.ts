import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';
import username from 'username';

import { setInitialForgeConfig } from '../../util/forge-config';
import installDepList, { DepType, DepVersionRestriction } from '../../util/install-dependencies';
import { readRawPackageJson } from '../../util/read-package-json';

const d = debug('electron-forge:init:npm');
const corePackage = fs.readJsonSync(path.resolve(__dirname, '../../../package.json'));

export function siblingDep(name: string) {
  return `@electron-forge/${name}@${corePackage.version}`;
}

export const deps = ['electron-squirrel-startup'];
export const devDeps = [
  siblingDep('cli'),
  siblingDep('maker-squirrel'),
  siblingDep('maker-zip'),
  siblingDep('maker-deb'),
  siblingDep('maker-rpm'),
];
export const exactDevDeps = ['electron'];

export default async (dir: string) => {
  await asyncOra('Initializing NPM Module', async () => {
    const packageJSON = await readRawPackageJson(path.resolve(__dirname, '../../../tmpl'));
    // eslint-disable-next-line no-multi-assign
    packageJSON.productName = packageJSON.name = path.basename(dir).toLowerCase();
    packageJSON.author = await username();
    setInitialForgeConfig(packageJSON);

    packageJSON.scripts.lint = 'echo "No linting configured"';

    d('writing package.json to:', dir);
    await fs.writeJson(path.resolve(dir, 'package.json'), packageJSON, { spaces: 2 });
  });

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
