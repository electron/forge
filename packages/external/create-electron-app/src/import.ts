import fs from 'node:fs/promises';
import path from 'node:path';
import { styleText } from 'node:util';

import {
  DepType,
  DepVersionRestriction,
  installDependencies,
  isYarnBerry,
  pathExists,
  PMDetails,
  readJson,
  resolvePackageManager,
  updateElectronDependency,
  writeJson,
} from '@electron-forge/core-utils';
import { ForgeListrOptions } from '@electron-forge/shared-types';
import baseTemplate from '@electron-forge/template-base';
import debug from 'debug';
import { Listr } from 'listr2';

import { initGit } from './init-scripts/init-git.js';
import { deps, devDeps, exactDevDeps } from './init-scripts/init-npm.js';

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
  shouldRemoveDependency?: (
    dependency: string,
    explanation: string,
  ) => Promise<boolean>;
  /**
   * An async function that returns whether the given script should be overridden with a forge one
   */
  shouldUpdateScript?: (
    scriptName: string,
    newValue: string,
  ) => Promise<boolean>;
  /**
   * The path to the directory containing generated distributables
   */
  outDir?: string;
  /**
   * By default, Forge initializes a git repository in the project directory. Set this option to `true` to skip this step.
   */
  skipGit?: boolean;
  /**
   * Force a package manager to use (npm|yarn|pnpm). By default, the package
   * manager is detected from the lockfile in the project directory.
   */
  packageManager?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const readRawPackageJson = async (dir: string): Promise<any> =>
  readJson(path.resolve(dir, 'package.json'));

/**
 * The config file extensions Forge looks for, in the order it looks for them.
 * Mirrors the lookup in `@electron-forge/core`'s `forge-config.ts`.
 */
const FORGE_CONFIG_EXTENSIONS = ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts'];

/**
 * Returns the name of the project's existing Forge config: `package.json` when
 * it holds a `config.forge` object, the file `config.forge` points to when it
 * is a string, or the first `forge.config.*` file found. Returns `undefined`
 * when the project has none.
 */
export async function findExistingForgeConfig(
  dir: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  packageJSON: any,
): Promise<string | undefined> {
  const configForge = packageJSON?.config?.forge;
  if (configForge && typeof configForge === 'object') {
    return 'package.json';
  }
  if (typeof configForge === 'string' && configForge.length > 0) {
    return configForge;
  }
  for (const extension of FORGE_CONFIG_EXTENSIONS) {
    const configName = `forge.config${extension}`;
    if (await pathExists(path.resolve(dir, configName))) {
      return configName;
    }
  }
  return undefined;
}

/**
 * Rewrites the base template's CommonJS `forge.config.js` as an ES module, for
 * projects whose `package.json` has `"type": "module"`. In those projects a
 * `.js` file is loaded as ESM, so `require()` and `module.exports` would throw.
 */
export function toESModuleConfig(source: string): string {
  return source
    .replace(
      /^const (\{[^}]*\}|\w+) = require\((['"][^'"]+['"])\);$/gm,
      'import $1 from $2;',
    )
    .replace(/^module\.exports = /m, 'export default ');
}

export const forgeImport = async ({
  dir = process.cwd(),
  interactive = false,
  confirmImport,
  shouldContinueOnExisting,
  shouldRemoveDependency,
  shouldUpdateScript,
  outDir,
  skipGit = false,
  packageManager,
}: ImportOptions): Promise<void> => {
  const listrOptions: ForgeListrOptions<{ pm: PMDetails }> = {
    concurrent: false,
    rendererOptions: {
      collapseSubtasks: false,
      collapseErrors: false,
    },
    silentRendererCondition: !interactive,
    fallbackRendererCondition:
      Boolean(process.env.DEBUG) || Boolean(process.env.CI),
  };

  const runner = new Listr(
    [
      {
        title: 'Locating importable project',
        task: async () => {
          d(`Attempting to import project in: ${dir}`);
          if (
            !(await pathExists(dir)) ||
            !(await pathExists(path.resolve(dir, 'package.json')))
          ) {
            throw new Error(
              `We couldn't find a project with a package.json file in: ${dir}`,
            );
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
        },
      },
      {
        title: 'Processing configuration and dependencies',
        rendererOptions: {
          persistentOutput: true,
          bottomBar: Infinity,
        },
        task: async (_ctx, task) => {
          const calculatedOutDir = outDir || 'out';

          const importDeps = ([] as string[]).concat(deps);
          let importDevDeps = ([] as string[]).concat(devDeps);
          let importExactDevDeps = ([] as string[]).concat(exactDevDeps);

          const packageJSON = await readRawPackageJson(dir);
          if (!packageJSON.version) {
            task.output = styleText(
              'yellow',
              `Please set the ${styleText('green', '"version"')} in your application's package.json`,
            );
          }
          const existingConfig = await findExistingForgeConfig(
            dir,
            packageJSON,
          );
          if (existingConfig) {
            task.output = styleText(
              'green',
              `Existing Electron Forge configuration detected in ${existingConfig}, keeping it as-is`,
            );
            if (typeof shouldContinueOnExisting === 'function') {
              if (!(await shouldContinueOnExisting())) {
                // TODO: figure out if we can just return early here
                // eslint-disable-next-line no-process-exit
                process.exit(0);
              }
            }
          }

          packageJSON.dependencies = packageJSON.dependencies || {};
          packageJSON.devDependencies = packageJSON.devDependencies || {};

          [importDevDeps, importExactDevDeps] = updateElectronDependency(
            packageJSON,
            importDevDeps,
            importExactDevDeps,
          );

          const keys = Object.keys(packageJSON.dependencies).concat(
            Object.keys(packageJSON.devDependencies),
          );
          const buildToolPackages: Record<string, string | undefined> = {
            '@electron/get':
              'already uses this module as a transitive dependency',
            '@electron/osx-sign':
              'already uses this module as a transitive dependency',
            '@electron/packager':
              'already uses this module as a transitive dependency',
            'electron-builder': 'provides mostly equivalent functionality',
            'electron-download':
              'already uses this module as a transitive dependency',
            'electron-forge': 'replaced with @electron-forge/cli',
            'electron-installer-debian':
              'already uses this module as a transitive dependency',
            'electron-installer-dmg':
              'already uses this module as a transitive dependency',
            'electron-installer-flatpak':
              'already uses this module as a transitive dependency',
            'electron-installer-redhat':
              'already uses this module as a transitive dependency',
            'electron-winstaller':
              'already uses this module as a transitive dependency',
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

          const updatePackageScript = async (
            scriptName: string,
            newValue: string,
          ) => {
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
          await updatePackageScript('release', 'electron-forge release');

          d('forgified scripts object:', packageJSON.scripts);

          const writeChanges = async () => {
            await writeJson(path.resolve(dir, 'package.json'), packageJSON, {
              spaces: 2,
            });
          };

          return task.newListr(
            [
              {
                title: `Resolving package manager`,
                task: async (ctx, task) => {
                  ctx.pm = await resolvePackageManager(packageManager, {
                    cwd: dir,
                  });
                  task.title = `Resolved package manager: ${styleText('cyan', ctx.pm.executable)}`;
                },
              },
              {
                title: 'Configuring package manager (if applicable)',
                task: async ({ pm }) => {
                  if (pm.executable === 'yarn' && isYarnBerry(pm.version)) {
                    // Yarn 2+ defaults to PnP, which doesn't work with the
                    // CommonJS requires in our forge config, so ensure that
                    // nodeLinker is set to node-modules
                    const yarnrcPath = path.resolve(dir, '.yarnrc.yml');
                    if (!(await pathExists(yarnrcPath))) {
                      d('creating .yarnrc.yml with nodeLinker: node-modules');
                      await fs.copyFile(
                        path.resolve(baseTemplate.templateDir, '_yarnrc.yml'),
                        yarnrcPath,
                      );
                    }
                  } else if (pm.executable === 'pnpm') {
                    // pnpm 10+ skips dependency build scripts unless they are
                    // allowed, and Electron needs its postinstall to download
                    // the binary
                    const workspacePath = path.resolve(
                      dir,
                      'pnpm-workspace.yaml',
                    );
                    if (!(await pathExists(workspacePath))) {
                      d('creating pnpm-workspace.yaml from the base template');
                      await fs.copyFile(
                        path.resolve(
                          baseTemplate.templateDir,
                          'pnpm-workspace.yaml',
                        ),
                        workspacePath,
                      );
                    }
                  }
                },
              },
              {
                title: 'Installing dependencies',
                task: async ({ pm }, task) => {
                  await writeChanges();

                  d('deleting old dependencies forcefully');
                  await fs.rm(path.resolve(dir, 'node_modules/.bin/electron'), {
                    recursive: true,
                    force: true,
                  });
                  await fs.rm(
                    path.resolve(dir, 'node_modules/.bin/electron.cmd'),
                    { recursive: true, force: true },
                  );

                  d('installing dependencies');
                  task.output = `${pm.executable} ${pm.install} ${importDeps.join(' ')}`;
                  await installDependencies(pm, dir, importDeps);

                  d('installing devDependencies');
                  task.output = `${pm.executable} ${pm.install} ${pm.dev} ${importDevDeps.join(' ')}`;
                  await installDependencies(
                    pm,
                    dir,
                    importDevDeps,
                    DepType.DEV,
                  );

                  d('installing devDependencies with exact versions');
                  task.output = `${pm.executable} ${pm.install} ${pm.dev} ${pm.exact} ${importExactDevDeps.join(' ')}`;
                  await installDependencies(
                    pm,
                    dir,
                    importExactDevDeps,
                    DepType.DEV,
                    DepVersionRestriction.EXACT,
                  );
                },
              },
              {
                title: 'Copying base template Forge configuration',
                skip: () =>
                  existingConfig
                    ? `Keeping the existing configuration in ${existingConfig}`
                    : false,
                task: async () => {
                  let templateConfig = await fs.readFile(
                    path.resolve(baseTemplate.templateDir, 'forge.config.js'),
                    'utf8',
                  );
                  if (packageJSON.type === 'module') {
                    d(
                      'package.json has "type": "module", writing an ESM forge.config.js',
                    );
                    templateConfig = toESModuleConfig(templateConfig);
                  } else {
                    d('writing new forge.config.js');
                  }
                  await fs.writeFile(
                    path.resolve(dir, 'forge.config.js'),
                    templateConfig,
                  );
                },
              },
              {
                title: 'Fixing .gitignore',
                task: async () => {
                  if (await pathExists(path.resolve(dir, '.gitignore'))) {
                    const gitignore = await fs.readFile(
                      path.resolve(dir, '.gitignore'),
                    );
                    if (!gitignore.includes(calculatedOutDir)) {
                      await fs.writeFile(
                        path.resolve(dir, '.gitignore'),
                        `${gitignore}\n${calculatedOutDir}/`,
                      );
                    }
                  }
                },
              },
            ],
            { concurrent: listrOptions.concurrent },
          );
        },
      },
      {
        title: 'Finalizing import',
        rendererOptions: {
          persistentOutput: true,
          bottomBar: Infinity,
        },
        task: (_ctx, task) => {
          task.output = `We have attempted to convert your app to be in a format that Electron Forge understands.

          Thanks for using ${styleText('green', 'Electron Forge')}!`;
        },
      },
    ],
    listrOptions,
  );

  await runner.run();
};
