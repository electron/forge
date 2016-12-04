import debug from 'debug';
import fs from 'fs-promise';
import ora from 'ora';
import path from 'path';
import username from 'username';

import installDepList from '../util/install-dependencies';
import readPackageJSON from '../util/read-package-json';

const d = debug('electron-forge:init:npm');

export const deps = ['electron-compile'];
export const devDeps = ['babel-preset-stage-0'];
export const exactDevDeps = ['electron-prebuilt-compile'];
export const standardDeps = ['standard'];
export const airbnDeps = ['eslint', 'eslint-config-airbnb', 'eslint-plugin-import',
  'eslint-plugin-jsx-a11y@^2.2.3', 'eslint-plugin-react'];

export default async (dir, lintStyle) => {
  const initSpinner = ora.ora('Initializing NPM Module').start();
  const packageJSON = await readPackageJSON(path.resolve(__dirname, '../../tmpl'));
  packageJSON.productName = packageJSON.name = path.basename(dir).toLowerCase();
  packageJSON.config.forge.electronWinstallerConfig.name = packageJSON.name.replace(/-/g, '_');
  packageJSON.author = await username();
  switch (lintStyle) {
    case 'standard':
      packageJSON.scripts.lint = 'standard';
      break;
    case 'airbnb':
      packageJSON.scripts.lint = 'eslint src';
      break;
    default:
      packageJSON.scripts.lint = 'echo "No linting yet..."';
      break;
  }
  d('writing package.json to:', dir);
  await fs.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON, null, 4));
  initSpinner.succeed();

  const installSpinner = ora.ora('Installing NPM Dependencies').start();

  try {
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
      default:
        d('installing airbnb linting dependencies');
        await installDepList(dir, airbnDeps, true);
        break;
    }
  } catch (err) {
    installSpinner.fail();
    throw err;
  }

  installSpinner.succeed();
};
