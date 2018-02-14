import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';

import initGit from '../init/init-git';
import { deps, devDeps, exactDevDeps } from '../init/init-npm';

import { setInitialForgeConfig } from '../util/forge-config';
import asyncOra from '../util/ora-handler';
import { info, warn } from '../util/messages';
import installDepList from '../util/install-dependencies';
import readPackageJSON from '../util/read-package-json';
import confirmIfInteractive from '../util/confirm-if-interactive';

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

  for (const key of keys) {
    if (buildToolPackages[key]) {
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
      await fs.writeJson(path.resolve(dir, 'package.json'), packageJSON, { spaces: 2 });
    });
  };

  await writeChanges();

  await asyncOra('Installing dependencies', async () => {
    d('deleting old dependencies forcefully');
    await fs.remove(path.resolve(dir, 'node_modules/.bin/electron'));
    await fs.remove(path.resolve(dir, 'node_modules/.bin/electron.cmd'));

    d('installing dependencies');
    await installDepList(dir, deps);

    d('installing devDependencies');
    await installDepList(dir, devDeps, true);

    d('installing exactDevDependencies');
    await installDepList(dir, exactDevDeps, true, true);
  });

  packageJSON = await readPackageJSON(dir);

  if (!packageJSON.version) {
    warn(interactive, "Please set the 'version' in your application's package.json".yellow);
  }

  packageJSON.config = packageJSON.config || {};
  const templatePackageJSON = await readPackageJSON(path.resolve(__dirname, '../../tmpl'));
  packageJSON.config.forge = templatePackageJSON.config.forge;
  setInitialForgeConfig(packageJSON);

  await writeChanges();

  await asyncOra('Fixing .gitignore', async () => {
    if (await fs.pathExists(path.resolve(dir, '.gitignore'))) {
      const gitignore = await fs.readFile(path.resolve(dir, '.gitignore'));
      if (!gitignore.includes(outDir)) {
        await fs.writeFile(path.resolve(dir, '.gitignore'), `${gitignore}\n${outDir}/`);
      }
    }
  });

  info(interactive, `

We have ATTEMPTED to convert your app to be in a format that electron-forge understands.

Thanks for using ${'"electron-forge"'.green}!!!`);
};
