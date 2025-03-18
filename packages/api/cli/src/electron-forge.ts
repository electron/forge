#!/usr/bin/env node
// This file requires a shebang above. If it is missing, this is an error.

import { program } from 'commander';
import { Listr } from 'listr2';
import semver from 'semver';

import packageJSON from '../package.json';

if (!semver.satisfies(process.versions.node, packageJSON.engines.node)) {
  console.error(`You are running Node.js version ${process.versions.node}, but Electron Forge requires Node.js ${packageJSON.engines.node}.`);
  process.exit(1);
}

import './util/terminate';

import { checkSystem, SystemCheckContext } from './util/check-system';

program
  .version(packageJSON.version, '-V, --version', 'Output the current version.')
  .helpOption('-h, --help', 'Output usage information.')
  .command('init', 'Initialize a new Electron application.')
  .command('import', 'Import an existing Electron project to Forge.')
  .command('start', 'Start the current Electron application in development mode.')
  .command('package', 'Package the current Electron application.')
  .command('make', 'Generate distributables for the current Electron application.')
  .command('publish', 'Publish the current Electron application.')
  .passThroughOptions(true)
  .hook('preSubcommand', async (_command, subcommand) => {
    if (!process.argv.includes('--help') && !process.argv.includes('-h')) {
      const runner = new Listr<SystemCheckContext>(
        [
          {
            title: 'Checking your system',
            task: async (ctx, task) => {
              ctx.command = subcommand.name();
              ctx.git = !process.argv.includes('--skip-git');
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
