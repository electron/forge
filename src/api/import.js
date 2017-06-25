import debug from 'debug';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';

import initGit from '../init/init-git';
import { deps, devDeps, exactDevDeps } from '../init/init-npm';

import asyncOra from '../util/ora-handler';
import { info, warn } from '../util/messages';
import installDepList from '../util/install-dependencies';
import readPackageJSON from '../util/read-package-json';
import confirmIfInteractive from '../util/confirm-if-interactive';
import { yarnOrNpmSpawn, hasYarn } from '../util/yarn-or-npm';

const d = debug('electron-forge:import');

/**
 * @typedef {Object} ImportOptions
 * @property {string} [dir=process.cwd()] The path to the app to be imported
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {boolean} [updateScripts=true] Whether to update the modules package.json scripts to be electron-forge commands
 * @property {string} [outDir=`${dir}/out`] The path to the directory containing generated distributables
 */

/**
 * Attempt to import a given module directory to the Electron Forge standard.
 *
 * - Replaces the prebuilt electron package with the one that integrates with `electron-compile`
 * - Sets up `git` and the correct NPM dependencies
 * - Adds a template forge config to `package.json`
 *
 * @param {ImportOptions} providedOptions - Options for the import method
 * @return {Promise} Will resolve when the import process is complete
 */
export default async (providedOptions = {}) => {
  const { dir, interactive, updateScripts } = Object.assign({
    dir: process.cwd(),
    interactive: false,
    updateScripts: true,
  }, providedOptions);

  const outDir = providedOptions.outDir || 'out';
  asyncOra.interactive = interactive;

  d(`Attempting to import project in: ${dir}`);
  if (!await fs.pathExists(dir) || !await fs.pathExists(path.resolve(dir, 'package.json'))) {
    throw `We couldn't find a project in: ${dir}`;
  }

  // eslint-disable-next-line max-len
  const confirm = await confirmIfInteractive(interactive, `WARNING: We will now attempt to import: "${dir}".  This will involve modifying some files, are you sure you want to continue?`);

  if (!confirm) {
    process.exit(0);
  }

  await initGit(dir);

  let packageJSON = await readPackageJSON(dir);
  if (packageJSON.config && packageJSON.config.forge) {
    warn(interactive, 'It looks like this project is already configured for "electron-forge"'.green);
    const shouldContinue = await confirmIfInteractive(interactive, 'Are you sure you want to continue?');

    if (!shouldContinue) {
      process.exit(0);
    }
  }

  // eslint-disable-next-line max-len
  const shouldChangeMain = await confirmIfInteractive(interactive, 'Do you want us to change the "main" attribute of your package.json?  If you are currently using babel and pointing to a "build" directory say yes.', false);
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
  const buildToolPackages = {
    'electron-builder': 'provides mostly equivalent functionality',
    'electron-download': 'already uses this module as a transitive dependency',
    'electron-installer-debian': 'already uses this module as a transitive dependency',
    'electron-installer-dmg': 'already uses this module as a transitive dependency',
    'electron-installer-flatpak': 'already uses this module as a transitive dependency',
    'electron-installer-redhat': 'already uses this module as a transitive dependency',
    'electron-osx-sign': 'already uses this module as a transitive dependency',
    'electron-packager': 'already uses this module as a transitive dependency',
    'electron-winstaller': 'already uses this module as a transitive dependency',
  };

  let electronName;
  for (const key of keys) {
    if (key === 'electron' || key === 'electron-prebuilt') {
      delete packageJSON.dependencies[key];
      delete packageJSON.devDependencies[key];
      electronName = key;
    } else if (buildToolPackages[key]) {
      const explanation = buildToolPackages[key];
      // eslint-disable-next-line max-len
      const shouldRemoveDependency = await confirmIfInteractive(interactive, `Do you want us to remove the "${key}" dependency in package.json? Electron Forge ${explanation}.`);

      if (shouldRemoveDependency) {
        delete packageJSON.dependencies[key];
        delete packageJSON.devDependencies[key];
      }
    }
  }

  packageJSON.scripts = packageJSON.scripts || {};
  d('reading current scripts object:', packageJSON.scripts);

  const updatePackageScript = async (scriptName, newValue) => {
    if (packageJSON.scripts[scriptName] !== newValue) {
      // eslint-disable-next-line max-len
      const shouldUpdate = await confirmIfInteractive(interactive, `Do you want us to update the "${scriptName}" script to instead call the electron-forge task "${newValue}"`, updateScripts);
      if (shouldUpdate) {
        packageJSON.scripts[scriptName] = newValue;
      }
    }
  };

  await updatePackageScript('start', 'electron-forge start');
  await updatePackageScript('package', 'electron-forge package');
  await updatePackageScript('make', 'electron-forge make');

  d('forgified scripts object:', packageJSON.scripts);

  const writeChanges = async () => {
    await asyncOra('Writing modified package.json file', async () => {
      await fs.writeFile(path.resolve(dir, 'package.json'), `${JSON.stringify(packageJSON, null, 2)}\n`);
    });
  };

  let electronVersion;
  if (electronName) {
    const electronPackageJSON = await readPackageJSON(path.resolve(dir, 'node_modules', electronName));
    electronVersion = electronPackageJSON.version;
    packageJSON.devDependencies['electron-prebuilt-compile'] = electronVersion;
  }

  await writeChanges();

  if (electronName) {
    await asyncOra('Pruning deleted modules', async () => {
      d('attempting to prune node_modules in:', dir);
      await yarnOrNpmSpawn(hasYarn() ? [] : ['prune'], {
        cwd: dir,
        stdio: 'ignore',
      });
    });
  }

  await asyncOra('Installing dependencies', async () => {
    d('deleting old dependencies forcefully');
    await fs.remove(path.resolve(dir, 'node_modules/.bin/electron'));
    await fs.remove(path.resolve(dir, 'node_modules/.bin/electron.cmd'));

    if (electronName) {
      await fs.remove(path.resolve(dir, 'node_modules', electronName));
    }

    d('installing dependencies');
    await installDepList(dir, deps);

    d('installing devDependencies');
    await installDepList(dir, devDeps, true);

    d('installing exactDevDependencies');
    await installDepList(dir, exactDevDeps.map((dep) => {
      if (dep === 'electron-prebuild-compile') {
        return `${dep}@${electronVersion || 'latest'}`;
      }

      return dep;
    }), true, true);
  });

  packageJSON = await readPackageJSON(dir);

  packageJSON.config = packageJSON.config || {};
  const templatePackageJSON = await readPackageJSON(path.resolve(__dirname, '../../tmpl'));
  packageJSON.config.forge = templatePackageJSON.config.forge;

  await writeChanges();

  await asyncOra('Fixing .gitignore', async () => {
    if (await fs.pathExists(path.resolve(dir, '.gitignore'))) {
      const gitignore = await fs.readFile(path.resolve(dir, '.gitignore'));
      if (!gitignore.includes(outDir)) {
        await fs.writeFile(path.resolve(dir, '.gitignore'), `${gitignore}\n${outDir}/`);
      }
    }
  });

  let babelConfig = packageJSON.babel;
  const babelPath = path.resolve(dir, '.babelrc');
  if (!babelConfig && await fs.pathExists(babelPath)) {
    babelConfig = JSON.parse(await fs.readFile(babelPath, 'utf8'));
  }

  if (babelConfig) {
    await asyncOra('Porting original babel config', async () => {
      let compileConfig = {};
      const compilePath = path.resolve(dir, '.compilerc');
      if (await fs.pathExists(compilePath)) {
        compileConfig = JSON.parse(await fs.readFile(compilePath, 'utf8'));
      }

      await fs.writeFile(compilePath, JSON.stringify(Object.assign(compileConfig, {
        'application/javascript': babelConfig,
      }), null, 2));
    });

    info(interactive, 'NOTE: You might be able to remove your `.compilerc` file completely if you are only using the `es2016` and `react` presets'.yellow);
  }

  info(interactive, `

We have ATTEMPTED to convert your app to be in a format that electron-forge understands.
Nothing much will have changed but we added the ${'"electron-prebuilt-compile"'.cyan} dependency.  This is \
the dependency you must version bump to get newer versions of Electron.


We also tried to import any build tooling you already had but we can't get everything.  You might need to convert any CLI/gulp/grunt tasks yourself.

Also please note if you are using \`preload\` scripts you need to follow the steps outlined \
at https://github.com/electron-userland/electron-forge/wiki/Using-%27preload%27-scripts

Thanks for using ${'"electron-forge"'.green}!!!`);
};
