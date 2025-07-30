import { api, InitOptions } from '@electron-forge/core';
import { confirm, select } from '@inquirer/prompts';
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
  .option('-c, --copy-ci-files', 'Whether to copy the templated CI files.', false)
  .option('-f, --force', 'Whether to overwrite an existing directory.', false)
  .option('--skip-git', 'Skip initializing a git repository in the initialized project.', false)
  .action(async (dir) => {
    const options = program.opts();
    const tasks = new Listr<InitOptions>(
      [
        {
          task: async (initOpts): Promise<void> => {
            // Initialize options and default values
            initOpts.interactive = true;
            initOpts.copyCIFiles = !!options.copyCiFiles;
            initOpts.force = !!options.force;
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
            if (options.template) {
              initOpts.template = options.template;
              return;
            }

            const prompt = task.prompt(ListrInquirerPromptAdapter);

            // Prompt the user for a build tool
            const buildTool: string = (await prompt.run(select, {
              message: 'Select a build tool',
              choices: [
                {
                  name: 'Base',
                  value: 'base',
                },
                {
                  name: 'Vite',
                  value: 'vite',
                },
                {
                  name: 'Webpack',
                  value: 'webpack',
                },
              ],
            })) as string;

            // Prompt the user for a programming language
            let language: string | undefined = undefined;
            if (buildTool !== 'base') {
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

            initOpts.template = `${buildTool}${language ? `-${language}` : ''}`;
          },
        },
        {
          task: async (initOpts, task): Promise<void> => {
            // Exit early, skipGit already provided.
            if (options.skipGit) {
              initOpts.skipGit = options.skipGit;
              return;
            }

            const prompt = task.prompt(ListrInquirerPromptAdapter);

            // Ask if the user would like to skip the git init command
            const skipGit = await prompt.run(confirm, {
              message: 'Would you like to skip the git initialization process?',
            });

            initOpts.skipGit = skipGit;
          },
        },
      ],
      { concurrent: false }
    );

    const initOpts: InitOptions = await tasks.run();
    await api.init(initOpts);
  });

program.parse(process.argv);
