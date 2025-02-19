import path from 'node:path';

import { PMDetails, resolvePackageManager, updateElectronDependency } from '@electron-forge/core-utils';
import { ForgeListrOptions, ForgeListrTaskFn } from '@electron-forge/shared-types';
import baseTemplate from '@electron-forge/template-base';
import { autoTrace } from '@electron-forge/tracer';
import chalk from 'chalk';
import debug from 'debug';
import fs from 'fs-extra';
import { Listr } from 'listr2';
import { merge } from 'lodash';

import installDepList, { DepType, DepVersionRestriction } from '../util/install-dependencies';
import { readRawPackageJson } from '../util/read-package-json';
import upgradeForgeConfig, { updateUpgradedForgeDevDeps } from '../util/upgrade-forge-config';

import { initGit } from './init-scripts/init-git';
import { deps, devDeps, exactDevDeps } from './init-scripts/init-npm';

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
  /**
   * By default, Forge initializes a git repository in the project directory. Set this option to `true` to skip this step.
   */
  skipGit?: boolean;
}

export default autoTrace(
  { name: 'import()', category: '@electron-forge/core' },
  async (
    childTrace,
    {
      dir = process.cwd(),
      interactive = false,
      confirmImport,
      shouldContinueOnExisting,
      shouldRemoveDependency,
      shouldUpdateScript,
      outDir,
      skipGit = false,
    }: ImportOptions
  ): Promise<void> => {
    const listrOptions: ForgeListrOptions<{ pm: PMDetails }> = {
      concurrent: false,
      rendererOptions: {
        collapseSubtasks: false,
        collapseErrors: false,
      },
      silentRendererCondition: !interactive,
      fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
    };

    const runner = new Listr(
      [
        {
          title: 'Locating importable project',
          task: childTrace({ name: 'locate-project', category: '@electron-forge/core' }, async () => {
            d(`Attempting to import project in: ${dir}`);
            if (!(await fs.pathExists(dir)) || !(await fs.pathExists(path.resolve(dir, 'package.json')))) {
              throw new Error(`We couldn't find a project with a package.json file in: ${dir}`);
            }

            if (typeof confirmImport === 'function') {
              if (!(await confirmImport())) {
                // TODO: figure out if we can just return early here
                // eslint-disable-next-line no-process-exit
                process.exit(0);
              }
            }

            if (!skipGit) {
              await initGit(dir);
            }
          }),
        },
        {
          title: 'Processing configuration and dependencies',
          rendererOptions: {
            persistentOutput: true,
            bottomBar: Infinity,
          },
          task: childTrace<Parameters<ForgeListrTaskFn>>({ name: 'string', category: 'foo' }, async (_, ctx, task) => {
            const calculatedOutDir = outDir || 'out';

            const importDeps = ([] as string[]).concat(deps);
            let importDevDeps = ([] as string[]).concat(devDeps);
            let importExactDevDeps = ([] as string[]).concat(exactDevDeps);

            let packageJSON = await readRawPackageJson(dir);
            if (!packageJSON.version) {
              task.output = chalk.yellow(`Please set the ${chalk.green('"version"')} in your application's package.json`);
            }
            if (packageJSON.config && packageJSON.config.forge) {
              if (packageJSON.config.forge.makers) {
                task.output = chalk.green('Existing Electron Forge configuration detected');
                if (typeof shouldContinueOnExisting === 'function') {
                  if (!(await shouldContinueOnExisting())) {
                    // TODO: figure out if we can just return early here
                    // eslint-disable-next-line no-process-exit
                    process.exit(0);
                  }
                }
              } else if (!(typeof packageJSON.config.forge === 'object')) {
                task.output = chalk.yellow(
                  "We can't tell if the Electron Forge config is compatible because it's in an external JavaScript file, not trying to convert it and continuing anyway"
                );
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
            const buildToolPackages: Record<string, string | undefined> = {
              '@electron/get': 'already uses this module as a transitive dependency',
              '@electron/osx-sign': 'already uses this module as a transitive dependency',
              '@electron/packager': 'already uses this module as a transitive dependency',
              'electron-builder': 'provides mostly equivalent functionality',
              'electron-download': 'already uses this module as a transitive dependency',
              'electron-forge': 'replaced with @electron-forge/cli',
              'electron-installer-debian': 'already uses this module as a transitive dependency',
              'electron-installer-dmg': 'already uses this module as a transitive dependency',
              'electron-installer-flatpak': 'already uses this module as a transitive dependency',
              'electron-installer-redhat': 'already uses this module as a transitive dependency',
              'electron-winstaller': 'already uses this module as a transitive dependency',
            };

            for (const key of keys) {
              if (buildToolPackages[key]) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const explanation = buildToolPackages[key]!;
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
              await fs.writeJson(path.resolve(dir, 'package.json'), packageJSON, { spaces: 2 });
            };

            return task.newListr<{ pm: PMDetails }>(
              [
                {
                  title: `Resolving package manager`,
                  task: async (ctx, task) => {
                    ctx.pm = await resolvePackageManager();
                    task.title = `Resolving package manager: ${chalk.cyan(ctx.pm.executable)}`;
                  },
                },
                {
                  title: 'Installing dependencies',
                  task: async ({ pm }, task) => {
                    await writeChanges();

                    d('deleting old dependencies forcefully');
                    await fs.remove(path.resolve(dir, 'node_modules/.bin/electron'));
                    await fs.remove(path.resolve(dir, 'node_modules/.bin/electron.cmd'));

                    d('installing dependencies');
                    task.output = `${pm.executable} ${pm.install} ${importDeps.join(' ')}`;
                    await installDepList(pm, dir, importDeps);

                    d('installing devDependencies');
                    task.output = `${pm.executable} ${pm.install} ${pm.dev} ${importDevDeps.join(' ')}`;
                    await installDepList(pm, dir, importDevDeps, DepType.DEV);

                    d('installing devDependencies with exact versions');
                    task.output = `${pm.executable} ${pm.install} ${pm.dev} ${pm.exact} ${importExactDevDeps.join(' ')}`;
                    await installDepList(pm, dir, importExactDevDeps, DepType.DEV, DepVersionRestriction.EXACT);
                  },
                },
                {
                  title: 'Copying base template Forge configuration',
                  task: async () => {
                    const pathToTemplateConfig = path.resolve(baseTemplate.templateDir, 'forge.config.js');

                    // if there's an existing config.forge object in package.json
                    if (packageJSON?.config?.forge && typeof packageJSON.config.forge === 'object') {
                      d('detected existing Forge config in package.json, merging with base template Forge config');
                      // eslint-disable-next-line @typescript-eslint/no-require-imports
                      const templateConfig = require(path.resolve(baseTemplate.templateDir, 'forge.config.js'));
                      packageJSON = await readRawPackageJson(dir);
                      merge(templateConfig, packageJSON.config.forge); // mutates the templateConfig object
                      await writeChanges();
                      // otherwise, write to forge.config.js
                    } else {
                      d('writing new forge.config.js');
                      await fs.copyFile(pathToTemplateConfig, path.resolve(dir, 'forge.config.js'));
                    }
                  },
                },
                {
                  title: 'Fixing .gitignore',
                  task: async () => {
                    if (await fs.pathExists(path.resolve(dir, '.gitignore'))) {
                      const gitignore = await fs.readFile(path.resolve(dir, '.gitignore'));
                      if (!gitignore.includes(calculatedOutDir)) {
                        await fs.writeFile(path.resolve(dir, '.gitignore'), `${gitignore}\n${calculatedOutDir}/`);
                      }
                    }
                  },
                },
              ],
              listrOptions
            );
          }),
        },
        {
          title: 'Finalizing import',
          rendererOptions: {
            persistentOutput: true,
            bottomBar: Infinity,
          },
          task: childTrace<Parameters<ForgeListrTaskFn>>({ name: 'finalize-import', category: '@electron-forge/core' }, (_, __, task) => {
            task.output = `We have attempted to convert your app to be in a format that Electron Forge understands.
          
          Thanks for using ${chalk.green('Electron Forge')}!`;
          }),
        },
      ],
      listrOptions
    );

    await runner.run();
  }
);
