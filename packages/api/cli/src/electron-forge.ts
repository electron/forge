#!/usr/bin/env node
// This file requires a shebang above. If it is missing, this is an error.

import { asyncOra } from '@electron-forge/async-ora';
import chalk from 'chalk';
import program from 'commander';

import './util/terminate';

import checkSystem from './util/check-system';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const metadata = require('../package.json');

const originalSC = program.executeSubCommand.bind(program);
program.executeSubCommand = (argv: string[], args: string[], unknown: string[]) => {
  let indexOfDoubleDash = process.argv.indexOf('--');
  indexOfDoubleDash = indexOfDoubleDash < 0 ? process.argv.length + 1 : indexOfDoubleDash;

  const passThroughArgs = args.filter((arg) => process.argv.indexOf(arg) > indexOfDoubleDash);
  const normalArgs = args.filter((arg) => process.argv.indexOf(arg) <= indexOfDoubleDash);

  let newArgs = args;
  let newUnknown = unknown;
  if (passThroughArgs.length > 0) {
    newArgs = normalArgs.concat(unknown).concat('--').concat(passThroughArgs);
    newUnknown = [];
  }
  return originalSC(argv, newArgs, newUnknown);
};

program
  .version(metadata.version)
  .option('--verbose', 'Enables verbose mode')
  .command('init', 'Initialize a new Electron application')
  .command('import', 'Attempts to navigate you through the process of importing an existing project to "electron-forge"')
  .command('lint', 'Lints the current Electron application')
  .command('package', 'Package the current Electron application')
  .command('make', 'Generate distributables for the current Electron application')
  .command('start', 'Start the current Electron application')
  .command('publish', 'Publish the current Electron application to GitHub')
  .command('install', 'Install an Electron application from GitHub')
  .on('command:*', (commands) => {
    // eslint-disable-next-line no-underscore-dangle
    if (!program._execs.has(commands[0])) {
      console.error();
      console.error(chalk.red(`Unknown command "${program.args.join(' ')}".`));
      console.error('See --help for a list of available commands.');
      process.exit(1);
    }
  });

(async () => {
  let goodSystem;
  await asyncOra('Checking your system', async (ora) => {
    goodSystem = await checkSystem(ora);
  });

  if (!goodSystem) {
    console.error(
      chalk.red(`It looks like you are missing some dependencies you need to get Electron running.
Make sure you have git installed and Node.js version ${metadata.engines.node}`)
    );
    process.exit(1);
  }

  program.parse(process.argv);
})();
