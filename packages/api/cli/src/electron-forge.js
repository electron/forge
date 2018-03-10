#!/usr/bin/env node
import 'colors';
import { asyncOra } from '@electron-forge/async-ora';
import program from 'commander';

import './util/terminate';

import checkSystem from './util/check-system';

const originalSC = program.executeSubCommand.bind(program);
program.executeSubCommand = (argv, args, unknown) => {
  let indexOfDoubleDash = process.argv.indexOf('--');
  indexOfDoubleDash = indexOfDoubleDash < 0 ? process.argv.length + 1 : indexOfDoubleDash;

  const passThroughArgs = args.filter(arg => process.argv.indexOf(arg) > indexOfDoubleDash);
  const normalArgs = args.filter(arg => process.argv.indexOf(arg) <= indexOfDoubleDash);

  let newArgs = args;
  let newUnknown = unknown;
  if (passThroughArgs.length > 0) {
    newArgs = normalArgs.concat(unknown).concat('--').concat(passThroughArgs);
    newUnknown = [];
  }
  return originalSC(argv, newArgs, newUnknown);
};

program
  .version(require('../package.json').version)
  .option('--verbose', 'Enables verbose mode')
  .command('init', 'Initialize a new Electron application')
  .command('import', 'Attempts to navigate you through the process of importing an existing project to "electron-forge"')
  .command('lint', 'Lints the current Electron application')
  .command('package', 'Package the current Electron application')
  .command('make', 'Generate distributables for the current Electron application')
  .command('start', 'Start the current Electron application')
  .command('publish', 'Publish the current Electron application to GitHub')
  .command('install', 'Install an Electron application from GitHub');

(async () => {
  let goodSystem;
  await asyncOra('Checking your system', async (ora) => {
    goodSystem = await checkSystem(ora);
  });

  if (!goodSystem) {
    console.error(('It looks like you are missing some dependencies you need to get Electron running.\n' +
                  'Make sure you have git installed and Node.js version 6.0.0+').red);
    process.exit(1);
  }

  program.parse(process.argv);
})();
