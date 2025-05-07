import { api, InitOptions } from '@electron-forge/core';
import { confirm, select } from '@inquirer/prompts';
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
    const initOpts: InitOptions = {
      interactive: true,
      copyCIFiles: !!options.copyCiFiles,
      force: !!options.force,
    };

    // Resolve the working directory
    const resolveDirectoryTask = new Listr([
      {
        title: 'Resolving directory',
        task: async () => {
          initOpts.dir = resolveWorkingDir(dir, false);
        },
      },
    ]);
    await resolveDirectoryTask.run();

    if (options.template) {
      initOpts.template = options.template;
    } else {
      // Prompt the user for a build tool
      const buildTool: string = await select({
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
      });

      // Prompt the user for a frontend framework
      // const framework: string | undefined  = await select({
      //   message: 'Select a frontend framework',
      //   choices: [
      //   {
      //     name: 'None',
      //     value: undefined,
      //   },
      //   {
      //     name: 'React',
      //     value: 'react',
      //   }]
      // });

      // Prompt the user for a programming language
      let language: string | undefined = undefined;
      if (buildTool !== 'base') {
        language = await select({
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
        });
      }

      initOpts.template = `${buildTool}${language ? `-${language}` : ''}`;
    }

    if (options.skipGit) {
      initOpts.skipGit = options.skipGit;
    } else {
      // Ask if the user would like to skip the git init command
      const skipGit: boolean = await confirm({
        message: 'Would you like to skip the git initialization process?',
      });

      initOpts.skipGit = skipGit;
    }

    await api.init(initOpts);
  });

program.parse(process.argv);
