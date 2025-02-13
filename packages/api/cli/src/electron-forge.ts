#!/usr/bin/env node
// This file requires a shebang above. If it is missing, this is an error.

import chalk from 'chalk';
import { program } from 'commander';
import { Listr } from 'listr2';

import './util/terminate';

import packageJSON from '../package.json';

import { checkSystem } from './util/check-system';

program
  .version(packageJSON.version, '-V, --version', 'Output the current version')
  .option('--verbose', 'Enables verbose mode')
  .helpOption('-h, --help', 'Output usage information')
  .command('init', 'Initialize a new Electron application')
  .command('import', 'Attempts to navigate you through the process of importing an existing project to "electron-forge"')
  .command('start', 'Start the current Electron application in development mode')
  .command('package', 'Package the current Electron application')
  .command('make', 'Generate distributables for the current Electron application')
  .command('publish', 'Publish the current Electron application')
  .hook('preSubcommand', async (_command, subcommand) => {
    if (!process.argv.includes('--help') && !process.argv.includes('-h')) {
      const runner = new Listr<{
        command: string;
      }>(
        [
          {
            title: 'Checking your system',
            task: async (ctx, task) => {
              ctx.command = subcommand.name();
              return await checkSystem(task);
            },
          },
        ],
        {
          concurrent: false,
          exitOnError: false,
          fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
        }
      );

      await runner.run();

      if (runner.errors.length) {
        console.error(
          chalk.red(`\nIt looks like you are missing some dependencies you need to get Electron running.
Make sure you have git installed and Node.js version ${packageJSON.engines.node}`)
        );
        process.exit(1);
      }
    }
  });

program.parse(process.argv);
