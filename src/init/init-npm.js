import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';
import username from 'username';

import { setInitialForgeConfig } from '../util/forge-config';
import installDepList from '../util/install-dependencies';
import readPackageJSON from '../util/read-package-json';
import asyncOra from '../util/ora-handler';

const d = debug('electron-forge:init:npm');

export const deps = ['electron-compile', 'electron-squirrel-startup'];
export const devDeps = ['babel-preset-env', 'babel-preset-react', 'babel-plugin-transform-async-to-generator', 'electron-forge'];
export const exactDevDeps = ['electron-prebuilt-compile'];
export const standardDeps = ['standard'];
export const airbnbDeps = ['eslint@^3', 'eslint-config-airbnb@^15', 'eslint-plugin-import@^2',
  'eslint-plugin-jsx-a11y@^5', 'eslint-plugin-react@^7'];

export default async (dir, lintStyle) => {
  await asyncOra('Initializing NPM Module', async () => {
    const packageJSON = await readPackageJSON(path.resolve(__dirname, '../../tmpl'));
    packageJSON.productName = packageJSON.name = path.basename(dir).toLowerCase();
    packageJSON.author = await username();
    setInitialForgeConfig(packageJSON);

    switch (lintStyle) {
      case 'standard':
        packageJSON.scripts.lint = 'standard';
        break;
      case 'airbnb':
        packageJSON.scripts.lint = 'eslint src --color';
        break;
      default:
        packageJSON.scripts.lint = 'echo "No linting configured"';
        break;
    }
    d('writing package.json to:', dir);
    await fs.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON, null, 4));
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

    switch (lintStyle) {
      case 'standard':
        d('installing standard linting dependencies');
        await installDepList(dir, standardDeps, true);
        break;
      case 'airbnb':
        d('installing airbnb linting dependencies');
        await installDepList(dir, airbnbDeps, true);
        break;
      default:
        d('not installing linting deps');
        break;
    }

    // NB: For babel-preset-env to work correctly, it needs to know the
    // actual version of Electron that we installed
    const content = JSON.parse(await fs.readFile(path.join(dir, '.compilerc'), 'utf8'));
    const electronPrebuilt = require(
      path.join(dir, 'node_modules', 'electron-prebuilt-compile', 'package.json'));

    for (const profile of ['development', 'production']) {
      const envTarget = content.env[profile]['application/javascript'].presets.find(x => x[0] === 'env');
      // parseFloat strips the patch version
      // parseFloat('1.3.2') === 1.3
      envTarget[1].targets.electron = parseFloat(electronPrebuilt.version);
    }

    await fs.writeFile(path.join(dir, '.compilerc'), JSON.stringify(content, null, 2), 'utf8');
  });
};
