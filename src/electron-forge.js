#!/usr/bin/env node
import 'colors';
import program from 'commander';

import './util/terminate';
import asyncOra from './util/ora-handler';
import checkSystem from './util/check-system';
import config from './util/config';


(async () => {
  let goodSystem;
  await asyncOra('Checking your system', async () => {
    goodSystem = await checkSystem();
  });

  if (!goodSystem) {
    console.error(('It looks like you are missing some dependencies you need to get Electron running.\n' +
                  'Make sure you have git installed and Node.js version 6.0.0+').red);
    process.exit(1);
  }

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
    .command('install', 'Install an Electron application from GitHub')
    .parse(process.argv);

  config.reset();
  config.set('verbose', !!program.verbose);
})();
