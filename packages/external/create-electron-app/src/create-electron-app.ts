import fs from 'node:fs';

import { confirm, select } from '@inquirer/prompts';
import { ListrInquirerPromptAdapter } from '@listr2/prompt-adapter-inquirer';
import chalk from 'chalk';
import { program } from 'commander';
import { Listr } from 'listr2';

import packageJSON from '../package.json';

import { forgeImport } from './import';
import { init, InitOptions } from './init';
import { resolveWorkingDir } from './util/resolve-working-dir';

// eslint-disable-next-line n/no-extraneous-import -- we get this from `@inquirer/prompts`
import type { Prompt } from '@inquirer/type';

program
  .version(packageJSON.version, '-V, --version', 'Output the current version.')
  .helpOption('-h, --help', 'Output usage information.');

const initCommand = program
  .command('init', { isDefault: true })
  .description('Initialize a new Electron Forge project.')
  .argument(
    '[dir]',
    'Directory to initialize the project in. Defaults to the current directory.',
  )
  .option('-t, --template [name]', 'Name of the Forge template to use.')
  .option('-c, --copy-ci-files', 'Whether to copy the templated CI files.')
  .option('-f, --force', 'Whether to overwrite an existing directory.')
  .option(
    '--skip-git',
    'Skip initializing a git repository in the initialized project.',
  )
  .option(
    '--electron-version [version]',
    'Set a specific Electron version for your Forge project. Can take in a version string (e.g. `38.3.0`) or `latest`, `beta`, or `nightly` tags.',
  )
  .option(
    '--package-manager [name]',
    'Set a specific package manager to use for your Forge project. Supported package managers are `npm`, `pnpm`, and `yarn`. You can also specify an exact version to use (e.g. `yarn@1.22.22`).',
  )
  .action(async (dir) => {
    const options = initCommand.opts();
    const tasks = new Listr<InitOptions>(
      [
        {
          task: async (initOpts): Promise<void> => {
            initOpts.interactive = true;
            initOpts.template = options.template ?? 'base';
            initOpts.copyCIFiles = Boolean(options.copyCiFiles);
            initOpts.force = Boolean(options.force);
            initOpts.skipGit = Boolean(options.skipGit);
            initOpts.dir = resolveWorkingDir(dir, false);
            initOpts.electronVersion = options.electronVersion ?? 'latest';
            initOpts.packageManager = options.packageManager ?? 'npm@latest';
          },
        },
        {
          task: async (initOpts, task): Promise<void> => {
            if (
              Object.keys(options).length > 0 ||
              process.env.CI ||
              !process.stdout.isTTY
            ) {
              return;
            }

            const prompt = task.prompt(ListrInquirerPromptAdapter);

            if (
              typeof initOpts.dir === 'string' &&
              fs.existsSync(initOpts.dir) &&
              (await fs.promises.readdir(initOpts.dir)).length > 0
            ) {
              const confirmResult = await prompt.run(confirm, {
                message: `${chalk.cyan(initOpts.dir)} is not empty. Would you like to continue and overwrite existing files?`,
                default: false,
              });

              if (confirmResult) {
                initOpts.force = true;
              } else {
                task.output = 'Directory is not empty. Exiting.';
                process.exit(0);
              }
            }

            const packageManager: string = await prompt.run<
              Prompt<string, any>
            >(select, {
              message: 'Select a package manager',
              choices: [
                { name: 'npm', value: 'npm@latest' },
                { name: 'pnpm', value: 'pnpm@latest' },
                { name: 'Yarn (Berry)', value: 'yarn@latest' },
                { name: 'Yarn (Classic)', value: 'yarn@1' },
              ],
            });

            const bundler: string = await prompt.run<Prompt<string, any>>(
              select,
              {
                message: 'Select a bundler',
                choices: [
                  {
                    name: 'None',
                    value: 'base',
                  },
                  {
                    name: 'Vite',
                    value: 'vite',
                  },
                  {
                    name: 'webpack',
                    value: 'webpack',
                  },
                ],
              },
            );

            let language: string | undefined;

            if (bundler !== 'base') {
              language = await prompt.run<Prompt<string | undefined, any>>(
                select,
                {
                  message: 'Select a programming language',
                  choices: [
                    {
                      name: 'JavaScript',
                      value: undefined,
                    },
                    {
                      name: 'TypeScript',
                      value: 'typescript',
                    },
                  ],
                },
              );
            }

            initOpts.packageManager = packageManager;
            initOpts.template = `${bundler}${language ? `-${language}` : ''}`;

            // TODO: add prompt for passing in an exact version as well
            initOpts.electronVersion = await prompt.run<Prompt<string, any>>(
              select,
              {
                message: 'Select an Electron release',
                choices: [
                  {
                    name: 'electron@latest',
                    value: 'latest',
                  },
                  {
                    name: 'electron@beta',
                    value: 'beta',
                  },
                  {
                    name: 'electron-nightly@latest',
                    value: 'nightly',
                  },
                ],
              },
            );

            initOpts.skipGit = !(await prompt.run(confirm, {
              message: `Would you like to initialize Git in your new project?`,
              default: true,
            }));
          },
        },
      ],
      { concurrent: false },
    );

    const initOpts: InitOptions = await tasks.run();
    await init(initOpts);
  });

program
  .command('import')
  .description('Import an existing Electron project to use Electron Forge.')
  .argument(
    '[dir]',
    'Directory of the project to import. Defaults to the current directory.',
  )
  .option(
    '--skip-git',
    'Skip initializing a git repository in the imported project.',
  )
  .action(async (dir, options) => {
    const workingDir = resolveWorkingDir(dir);
    await forgeImport({
      dir: workingDir,
      interactive: true,
      skipGit: Boolean(options.skipGit),
    });
  });

program.parse(process.argv);
