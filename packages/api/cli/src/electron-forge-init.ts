import { api, InitOptions } from '@electron-forge/core';
import { select } from '@inquirer/prompts';
import { ListrInquirerPromptAdapter } from '@listr2/prompt-adapter-inquirer';
import { program } from 'commander';
import { Listr } from 'listr2';

import './util/terminate';
import packageJSON from '../package.json';

import { resolveWorkingDir } from './util/resolve-working-dir';

program
  .version(packageJSON.version, '-V, --version', 'Output the current version.')
  .helpOption('-h, --help', 'Output usage information.')
  .argument('[dir]', 'Directory to initialize the project in. (default: current directory)')
  .option('-t, --template [name]', 'Name of the Forge template to use.', undefined)
  .option('-c, --copy-ci-files', 'Whether to copy the templated CI files.')
  .option('-f, --force', 'Whether to overwrite an existing directory.')
  .option('--skip-git', 'Skip initializing a git repository in the initialized project.')
  .action(async (dir) => {
    const options = program.opts();
    const tasks = new Listr<InitOptions>(
      [
        {
          task: async (initOpts): Promise<void> => {
            // Initialize options and default values
            initOpts.interactive = true;
            initOpts.copyCIFiles = Boolean(options.copyCiFiles);
            initOpts.force = Boolean(options.force);
            initOpts.skipGit = Boolean(options.skipGit);
          },
        },
        {
          title: 'Resolving directory',
          task: async (initOpts): Promise<void> => {
            // Resolve the provided directory
            initOpts.dir = resolveWorkingDir(dir, false);
          },
        },
        {
          task: async (initOpts, task): Promise<void> => {
            // Exit early, template already provided.
            if (options.template || Boolean(process.env.CI)) {
              initOpts.template = options.template;
              return;
            }

            const prompt = task.prompt(ListrInquirerPromptAdapter);

            // Prompt the user for a build tool
            const bundler: string = (await prompt.run(select, {
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
            })) as string;

            // Prompt the user for a programming language
            let language: string | undefined = undefined;
            if (bundler !== 'base') {
              language = (await prompt.run(select, {
                message: 'Select a programming language',
                choices: [
                  {
                    name: 'JavaScript',
                    value: undefined,
                  },
                  {
                    name: 'Typescript',
                    value: 'typescript',
                  },
                ],
              })) as string | undefined;
            }

            initOpts.template = `${bundler}${language ? `-${language}` : ''}`;
          },
        },
      ],
      { concurrent: false }
    );

    const initOpts: InitOptions = await tasks.run();
    await api.init(initOpts);
  });

program.parse(process.argv);
