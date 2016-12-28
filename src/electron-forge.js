#!/usr/bin/env node
import 'colors';
import ora from 'ora';
import program from 'commander';

import './util/terminate';
import checkSystem from './util/check-system';
import config from './util/config';

const checker = ora('Checking your System').start();
checkSystem()
  .then((goodSystem) => {
    checker.succeed();
    if (!goodSystem) {
      console.error(('It looks like you are missing some dependencies you need to get Electron running.\n' +
                    'Make sure you have git installed and Node.js version 6.0.0+').red);
      process.exit(1);
    }

    program
      .version(require('../package.json').version)
      .option('--verbose', 'Enables verbose mode')
      .command('init', 'Initialize a new Electron application')
      .command('lint', 'Lints the current Electron application')
      .command('package', 'Package the current Electron application')
      .command('make', 'Generate distributables for the current Electron application')
      .command('start', 'Start the current Electron application')
      .command('publish', 'Publish the current Electron application to GitHub')
      .parse(process.argv);

    config.reset();
    config.set('verbose', !!program.verbose);
  });
