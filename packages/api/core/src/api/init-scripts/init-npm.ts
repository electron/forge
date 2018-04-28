import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';
import username from 'username';

import { setInitialForgeConfig } from '../../util/forge-config';
import installDepList from '../../util/install-dependencies';
import readPackageJSON from '../../util/read-package-json';

const d = debug('electron-forge:init:npm');

export const deps = ['electron-squirrel-startup'];
export const devDeps = ['@electron-forge/cli'];
export const exactDevDeps = ['electron'];

export default async (dir: string) => {
  await asyncOra('Initializing NPM Module', async () => {
    const packageJSON = await readPackageJSON(path.resolve(__dirname, '../../../tmpl'));
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
    await installDepList(dir, devDeps, true);

    d('installing exact dependencies');
    for (const packageName of exactDevDeps) {
      await installDepList(dir, [packageName], true, true);
    }
  });
};
