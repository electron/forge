import path from 'node:path';

import { PMDetails, resolvePackageManager } from '@electron-forge/core-utils';
import { ForgeTemplate } from '@electron-forge/shared-types';
import chalk from 'chalk';
import debug from 'debug';
import { Listr } from 'listr2';
import semver from 'semver';

import installDepList, { DepType, DepVersionRestriction } from '../util/install-dependencies';
import { readRawPackageJson } from '../util/read-package-json';

import { findTemplate } from './init-scripts/find-template';
import { initDirectory } from './init-scripts/init-directory';
import { initGit } from './init-scripts/init-git';
import { initLink } from './init-scripts/init-link';
import { initNPM } from './init-scripts/init-npm';

const d = debug('electron-forge:init');

export interface InitOptions {
  /**
   * The path to the app to be initialized
   */
  dir?: string;
  /**
   * Whether to use sensible defaults or prompt the user visually
   */
  interactive?: boolean;
  /**
   * Whether to copy template CI files
   */
  copyCIFiles?: boolean;
  /**
   * Whether to overwrite an existing directory
   */
  force?: boolean;
  /**
   * The custom template to use. If left empty, the default template is used
   */
  template?: string;
  /**
   * By default, Forge initializes a git repository in the project directory. Set this option to `true` to skip this step.
   */
  skipGit?: boolean;
}

async function validateTemplate(template: string, templateModule: ForgeTemplate): Promise<void> {
  if (!templateModule.requiredForgeVersion) {
    throw new Error(`Cannot use a template (${template}) with this version of Electron Forge, as it does not specify its required Forge version.`);
  }

  const forgeVersion = (await readRawPackageJson(path.join(__dirname, '..', '..'))).version;
  if (!semver.satisfies(forgeVersion, templateModule.requiredForgeVersion)) {
    throw new Error(
      `Template (${template}) is not compatible with this version of Electron Forge (${forgeVersion}), it requires ${templateModule.requiredForgeVersion}`
    );
  }
}

export default async ({
  dir = process.cwd(),
  interactive = false,
  copyCIFiles = false,
  force = false,
  template = 'base',
  skipGit = false,
}: InitOptions): Promise<void> => {
  d(`Initializing in: ${dir}`);

  const runner = new Listr<{
    templateModule: ForgeTemplate;
    pm: PMDetails;
  }>(
    [
      {
        title: `Resolving package manager`,
        task: async (ctx, task) => {
          ctx.pm = await resolvePackageManager();
          task.title = `Resolving package manager: ${chalk.cyan(ctx.pm.executable)}`;
        },
      },
      {
        title: `Resolving template: ${chalk.cyan(template)}`,
        task: async (ctx, task) => {
          const tmpl = await findTemplate(template);
          ctx.templateModule = tmpl.template;
          task.output = `Using ${chalk.green(tmpl.name)} (${tmpl.type} module)`;
        },
        rendererOptions: { persistentOutput: true },
      },
      {
        title: 'Initializing directory',
        task: async (_, task) => {
          await initDirectory(dir, task, force);
        },
        rendererOptions: { persistentOutput: true },
      },
      {
        title: 'Initializing git repository',
        enabled: !skipGit,
        task: async () => {
          await initGit(dir);
        },
      },
      {
        title: 'Preparing template',
        task: async ({ templateModule }) => {
          await validateTemplate(template, templateModule);
        },
      },
      {
        title: `Initializing template`,
        task: async ({ templateModule }, task) => {
          if (typeof templateModule.initializeTemplate === 'function') {
            const tasks = await templateModule.initializeTemplate(dir, { copyCIFiles, force });
            if (tasks) {
              return task.newListr(tasks, { concurrent: false });
            }
          }
        },
      },
      {
        title: 'Installing template dependencies',
        task: async ({ templateModule }, task) => {
          return task.newListr(
            [
              {
                title: 'Installing production dependencies',
                task: async ({ pm }, task) => {
                  d('installing dependencies');
                  if (templateModule.dependencies?.length) {
                    task.output = `${pm.executable} ${pm.install} ${pm.dev} ${templateModule.dependencies.join(' ')}`;
                  }
                  return await installDepList(pm, dir, templateModule.dependencies || [], DepType.PROD, DepVersionRestriction.RANGE);
                },
                exitOnError: false,
              },
              {
                title: 'Installing development dependencies',
                task: async ({ pm }, task) => {
                  d('installing devDependencies');
                  if (templateModule.devDependencies?.length) {
                    task.output = `${pm.executable} ${pm.install} ${pm.dev} ${templateModule.devDependencies.join(' ')}`;
                  }
                  await installDepList(pm, dir, templateModule.devDependencies || [], DepType.DEV);
                },
                exitOnError: false,
              },
              {
                title: 'Finalizing dependencies',
                task: async (_, task) => {
                  return task.newListr([
                    {
                      title: 'Installing common dependencies',
                      task: async ({ pm }, task) => {
                        await initNPM(pm, dir, task);
                      },
                      exitOnError: false,
                    },
                    {
                      title: 'Linking Forge dependencies to local build',
                      enabled: !!process.env.LINK_FORGE_DEPENDENCIES_ON_INIT,
                      task: async ({ pm }, task) => {
                        await initLink(pm, dir, task);
                      },
                      exitOnError: true,
                    },
                  ]);
                },
              },
            ],
            {
              concurrent: false,
            }
          );
        },
      },
    ],
    {
      concurrent: false,
      silentRendererCondition: !interactive,
      fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
    }
  );

  await runner.run();
};
