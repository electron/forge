import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';

import initGit from './init-scripts/init-git';
import { deps, devDeps, exactDevDeps } from './init-scripts/init-npm';

import { setInitialForgeConfig } from '../util/forge-config';
import asyncOra from '../util/ora-handler';
import { info, warn } from '../util/messages';
import installDepList from '../util/install-dependencies';
import readPackageJSON from '../util/read-package-json';

const d = debug('electron-forge:import');

/**
 * @typedef {Object} ImportOptions
 * @property {string} [dir=process.cwd()] The path to the app to be imported
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {function} [confirmImport] An async function that returns true or false in order to confirm the start of importing
 * @property {function} [shouldContinueOnExisting] An async function that returns whether the import should continue if it looks like a forge project already
 * @property {function} [shouldRemoveDependency] An async function that returns whether the given dependency should be removed
 * @property {function} [shouldUpdateScript] An async function that returns whether the given script should be overridden with a forge one
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
  const { dir, interactive, confirmImport,
  shouldContinueOnExisting, shouldRemoveDependency, shouldUpdateScript } = Object.assign({
    dir: process.cwd(),
    interactive: false,
  }, providedOptions);

  const outDir = providedOptions.outDir || 'out';
  asyncOra.interactive = interactive;

  d(`Attempting to import project in: ${dir}`);
  if (!await fs.pathExists(dir) || !await fs.pathExists(path.resolve(dir, 'package.json'))) {
    throw `We couldn't find a project in: ${dir}`;
  }

  // eslint-disable-next-line max-len
  if (typeof confirmImport === 'function') {
    if (!await confirmImport()) {
      process.exit(0);
    }
  }

  await initGit(dir);

  let packageJSON = await readPackageJSON(dir);
  if (packageJSON.config && packageJSON.config.forge) {
    warn(interactive, 'It looks like this project is already configured for "electron-forge"'.green);
    if (typeof shouldContinueOnExisting === 'function') {
      if (!await shouldContinueOnExisting()) {
        process.exit(0);
      }
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
      let remove = true;
      if (typeof shouldRemoveDependency === 'function') {
        remove = await shouldRemoveDependency(key, explanation);
      }

      if (remove) {
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
      let update = true;
      if (typeof shouldUpdateScript === 'function') {
        update = await shouldUpdateScript(scriptName, newValue);
      }
      if (update) {
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
