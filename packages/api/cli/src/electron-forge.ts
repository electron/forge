#!/usr/bin/env node
// This file requires a shebang above. If it is missing, this is an error.

import { program } from 'commander';
import { Listr } from 'listr2';

import './util/terminate';

import packageJSON from '../package.json';

import { checkSystem } from './util/check-system';

program
  .version(packageJSON.version, '-V, --version', 'Output the current version.')
  .helpOption('-h, --help', 'Output usage information.')
  .command('init', 'Initialize a new Electron application.')
  .command('import', 'Import an existing Electron project to Forge.')
  .command('start', 'Start the current Electron application in development mode.')
  .command('package', 'Package the current Electron application.')
  .command('make', 'Generate distributables for the current Electron application.')
  .command('publish', 'Publish the current Electron application.')
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
          exitOnError: true,
          fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
        }
      );

      try {
        await runner.run();
      } catch {
        process.exit(1);
      }
    }
  });

program.parse(process.argv);
