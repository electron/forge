import fs from 'fs-promise';
import ora from 'ora';
import path from 'path';
import username from 'username';

import installDepList from '../util/install-dependencies';

const deps = [];
const devDeps = ['babel-preset-stage-0', 'electron-packager'];
const exactDevDeps = ['electron-prebuilt-compile'];
const standardDeps = ['standard'];
const airbnDeps = ['eslint', 'eslint-config-airbnb', 'eslint-plugin-import',
  'eslint-plugin-jsx-a11y@^2.2.3', 'eslint-plugin-react'];

export default async (dir, lintStyle) => {
  const initSpinner = ora('Initializing NPM Module').start();
  const packageJSON = JSON.parse(await fs.readFile(path.resolve(__dirname, '../../tmpl/package.json'), 'utf8'));
  packageJSON.productName = packageJSON.name = path.basename(dir).toLowerCase();
  packageJSON.author = await username();
  switch (lintStyle) {
    case 'standard':
      packageJSON.scripts.lint = 'standard';
      break;
    case 'airbnb':
    default:
      packageJSON.scripts.lint = 'eslint src';
      break;
  }
  await fs.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON, null, 4));
  initSpinner.succeed();

  const installSpinner = ora('Installing NPM Dependencies').start();

  try {
    await installDepList(dir, deps);
    await installDepList(dir, devDeps, true);
    for (const packageName of exactDevDeps) {
      await installDepList(dir, [packageName, '--exact'], true);
    }
    switch (lintStyle) {
      case 'standard':
        await installDepList(dir, standardDeps, true);
        break;
      case 'airbnb':
      default:
        await installDepList(dir, airbnDeps, true);
        break;
    }
  } catch (err) {
    installSpinner.fail();
    throw err;
  }

  installSpinner.succeed();
};
