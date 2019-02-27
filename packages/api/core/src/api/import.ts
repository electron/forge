import _merge from 'lodash.merge';
import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';

import initGit from './init-scripts/init-git';
import { deps, devDeps, exactDevDeps } from './init-scripts/init-npm';

import { updateElectronDependency } from '../util/electron-version';
import { setInitialForgeConfig } from '../util/forge-config';
import { info, warn } from '../util/messages';
import installDepList, { DepType, DepVersionRestriction } from '../util/install-dependencies';
import { readRawPackageJson } from '../util/read-package-json';
import upgradeForgeConfig, { updateUpgradedForgeDevDeps } from'../util/upgrade-forge-config';

const d = debug('electron-forge:import');

export interface ImportOptions {
  /**
   * The path to the app to be imported
   */
  dir?: string;
  /**
   * Whether to use sensible defaults or prompt the user visually
   */
  interactive?: boolean;
  /**
   * An async function that returns true or false in order to confirm the start
   * of importing
   */
  confirmImport?: () => Promise<boolean>;
  /**
   * An async function that returns whether the import should continue if it
   * looks like a forge project already
   */
  shouldContinueOnExisting?: () => Promise<boolean>;
  /**
   * An async function that returns whether the given dependency should be removed
   */
  shouldRemoveDependency?: (dependency: string, explanation: string) => Promise<boolean>;
  /**
   * An async function that returns whether the given script should be overridden with a forge one
   */
  shouldUpdateScript?: (scriptName: string, newValue: string) => Promise<boolean>;
  /**
   * The path to the directory containing generated distributables
   */
  outDir?: string;
}

export default async ({
  dir = process.cwd(),
  interactive = false,
  confirmImport,
  shouldContinueOnExisting,
  shouldRemoveDependency,
  shouldUpdateScript,
  outDir,
}: ImportOptions) => {
  const calculatedOutDir = outDir || 'out';
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

  const importDeps = ([] as string[]).concat(deps);
  let importDevDeps = ([] as string[]).concat(devDeps);
  let importExactDevDeps = ([] as string[]).concat(exactDevDeps);

  let packageJSON = await readRawPackageJson(dir);
  if (packageJSON.config && packageJSON.config.forge) {
    if (packageJSON.config.forge.makers) {
      warn(interactive, 'It looks like this project is already configured for Electron Forge'.green);
      if (typeof shouldContinueOnExisting === 'function') {
        if (!await shouldContinueOnExisting()) {
          process.exit(0);
        }
      }
    } else if (typeof packageJSON.config.forge === 'string') {
      warn(interactive, "We can't tell if the Electron Forge config is compatible because it's in an external JavaScript file, not trying to convert it and continuing anyway".yellow);
    } else {
      d('Upgrading an Electron Forge < 6 project');
      packageJSON.config.forge = upgradeForgeConfig(packageJSON.config.forge);
      importDevDeps = updateUpgradedForgeDevDeps(packageJSON, importDevDeps);
    }
  }

  packageJSON.dependencies = packageJSON.dependencies || {};
  packageJSON.devDependencies = packageJSON.devDependencies || {};

  [importDevDeps, importExactDevDeps] = updateElectronDependency(packageJSON, importDevDeps, importExactDevDeps);

  const keys = Object.keys(packageJSON.dependencies).concat(Object.keys(packageJSON.devDependencies));
  const buildToolPackages: {
    [key: string]: string | undefined;
  } = {
    'electron-builder': 'provides mostly equivalent functionality',
    'electron-download': 'already uses this module as a transitive dependency',
    'electron-forge': 'replaced with @electron-forge/cli',
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
      const explanation = buildToolPackages[key]!;
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

  const updatePackageScript = async (scriptName: string, newValue: string) => {
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
    await installDepList(dir, importDeps);

    d('installing devDependencies');
    await installDepList(dir, importDevDeps, DepType.DEV);

    d('installing exactDevDependencies');
    await installDepList(dir, importExactDevDeps, DepType.DEV, DepVersionRestriction.EXACT);
  });

  packageJSON = await readRawPackageJson(dir);

  if (!packageJSON.version) {
    warn(interactive, 'Please set the "version" in your application\'s package.json'.yellow);
  }

  packageJSON.config = packageJSON.config || {};
  const templatePackageJSON = await readRawPackageJson(path.resolve(__dirname, '../../tmpl'));
  if (packageJSON.config.forge) {
    if (typeof packageJSON.config.forge !== 'string') {
      packageJSON.config.forge = _merge(templatePackageJSON.config.forge, packageJSON.config.forge);
    }
  } else {
    packageJSON.config.forge = templatePackageJSON.config.forge;
  }

  if (typeof packageJSON.config.forge !== 'string') {
    setInitialForgeConfig(packageJSON);
  }

  await writeChanges();

  await asyncOra('Fixing .gitignore', async () => {
    if (await fs.pathExists(path.resolve(dir, '.gitignore'))) {
      const gitignore = await fs.readFile(path.resolve(dir, '.gitignore'));
      if (!gitignore.includes(calculatedOutDir)) {
        await fs.writeFile(path.resolve(dir, '.gitignore'), `${gitignore}\n${calculatedOutDir}/`);
      }
    }
  });

  info(interactive, `

We have ATTEMPTED to convert your app to be in a format that electron-forge understands.

Thanks for using ${'"electron-forge"'.green}!!!`);
};
