import debug from 'debug';
import fs from 'fs-promise';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import pify from 'pify';
import program from 'commander';
import rimraf from 'rimraf';
import { spawn as yarnOrNPMSpawn, hasYarn } from 'yarn-or-npm';

import initGit from './init/init-git';
import { deps, devDeps } from './init/init-npm';

import installDepList from './util/install-dependencies';

import './util/terminate';

const d = debug('electron-forge:import');

const main = async () => {
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[name]')
    .action((name) => {
      if (!name) return;
      if (path.isAbsolute(name)) {
        dir = name;
      } else {
        dir = path.resolve(dir, name);
      }
    })
    .parse(process.argv);

  d(`Attempting to import project in: ${dir}`);
  if (!await fs.exists(dir) || !await fs.exists(path.resolve(dir, 'package.json'))) {
    console.error(`We couldn't find a project in: ${dir}`.red);
    process.exit(1);
  }

  const { confirm } = await inquirer.createPromptModule()({
    type: 'confirm',
    name: 'confirm',
    message: `WARNING: We will now attempt to import: "${dir}".  This will involve modifying some files, are you sure you want to continue?`,
  });
  if (!confirm) {
    process.exit(1);
  }

  await initGit(dir);

  const packageJSONPath = path.resolve(dir, 'package.json');
  let packageJSON = JSON.parse(await fs.readFile(packageJSONPath, 'utf8'));
  if (packageJSON.config && packageJSON.config.forge) {
    console.warn('It looks like this project is already configured for "electron-forge"'.green);
    const { shouldContinue } = await inquirer.createPromptModule()({
      type: 'confirm',
      name: 'shouldContinue',
      message: 'Are you sure you want to continue?',
    });
    if (!shouldContinue) {
      process.exit(0);
    }
  }

  const { shouldChangeMain } = await inquirer.createPromptModule()({
    type: 'confirm',
    name: 'shouldChangeMain',
    message: 'Do you want us to change the "main" attribute of your package.json?  If you are currently using babel and pointing to a "build" directory say yes.', // eslint-disable-line
  });
  if (shouldChangeMain) {
    const { newMain } = await inquirer.createPromptModule()({
      type: 'input',
      name: 'newMain',
      default: packageJSON.main,
      message: 'Enter the relative path to your uncompiled main file',
    });
    packageJSON.main = newMain;
  }

  packageJSON.dependencies = packageJSON.dependencies || {};
  packageJSON.devDependencies = packageJSON.devDependencies || {};

  const keys = Object.keys(packageJSON.dependencies).concat(Object.keys(packageJSON.devDependencies));
  let electronName;
  for (const key of keys) {
    if (key === 'electron' || key === 'electron-prebuilt') {
      delete packageJSON.dependencies[key];
      delete packageJSON.devDependencies[key];
      electronName = key;
    }
  }

  const writeChanges = async () => {
    const writeSpinner = ora.ora('Writing modified package.json file').start();
    await fs.writeFile(packageJSONPath, `${JSON.stringify(packageJSON, null, 2)}\n`);
    writeSpinner.succeed();
  };

  let electronVersion;
  if (electronName) {
    electronVersion = JSON.parse(await fs.readFile(path.resolve(dir, 'node_modules', electronName, 'package.json'))).version;
    packageJSON.devDependencies['electron-prebuilt-compile'] = electronVersion;
  }

  await writeChanges();

  if (electronName) {
    const pruneSpinner = ora.ora('Pruning deleted modules').start();
    await new Promise((resolve) => {
      d('attempting to prune node_modules in:', dir);
      const child = yarnOrNPMSpawn(hasYarn() ? [] : ['prune'], {
        cwd: dir,
        stdio: 'ignore',
      });
      child.on('exit', () => resolve());
    });
    pruneSpinner.succeed();

    const installSpinner = ora.ora('Installing dependencies').start();

    await pify(rimraf)(path.resolve(dir, 'node_modules/.bin/electron'));
    await pify(rimraf)(path.resolve(dir, 'node_modules/.bin/electron.cmd'));
    await pify(rimraf)(path.resolve(dir, 'node_modules', electronName));

    d('installing dependencies');
    await installDepList(dir, deps);
    d('installing devDependencies');
    await installDepList(dir, devDeps, true);
    d('installing electron-prebuilt-compile');
    await installDepList(dir, [`electron-prebuilt-compile@${electronVersion}`], false, true);
    installSpinner.succeed();
  }

  packageJSON = JSON.parse(await fs.readFile(packageJSONPath, 'utf8'));

  packageJSON.config = packageJSON.config || {};
  packageJSON.config.forge = JSON.parse(await fs.readFile(path.resolve(__dirname, '../tmpl/package.json'))).config.forge;

  await writeChanges();

  const gitignoreSpinner = ora.ora('Fixing .gitignore').start();
  if (await fs.exists(path.resolve(dir, '.gitignore'))) {
    const gitignore = await fs.readFile(path.resolve(dir, '.gitignore'));
    if (!gitignore.includes('out')) {
      await fs.writeFile(path.resolve(dir, '.gitignore'), `${gitignore}\nout/`);
    }
  }
  gitignoreSpinner.succeed();

  let babelConfig = packageJSON.babel;
  const babelPath = path.resolve(dir, '.babelrc');
  if (!babelConfig && await fs.exists(babelPath)) {
    babelConfig = JSON.parse(await fs.readFile(babelPath, 'utf8'));
  }

  if (babelConfig) {
    const babelSpinner = ora.ora('Porting original babel config').start();

    let compileConfig = {};
    const compilePath = path.resolve(dir, '.compilerc');
    if (await fs.exists(compilePath)) {
      compileConfig = JSON.parse(await fs.readFile(compilePath, 'utf8'));
    }

    await fs.writeFile(compilePath, JSON.stringify(Object.assign(compileConfig, {
      'application/javascript': babelConfig,
    }, null, 2)));

    babelSpinner.succeed();
    console.info('NOTE: You might be able to remove your `.compilerc` file completely if you are only using the `es2015` and `react` presets'.yellow);
  }

  console.info(`

We have ATTEMPTED to convert your app to be in a format that electron-forge understands.
Nothing much will have changed but we added the ${'"electron-prebuilt-compile"'.cyan} dependency.  This is \
the dependency you must version bump to get newer versions of Electron.


We also tried to import any build tooling you already had but we can't get everything.  You might need to convert any CLI/gulp/grunt tasks yourself.

Also please note if you are using \`preload\` scripts you need to follow the steps outlined \
at https://github.com/electron-userland/electron-forge/wiki/Using-%27preload%27-scripts

Thanks for using ${'"electron-forge"'.green}!!!`);
};

main();
