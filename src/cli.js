#!/usr/bin/env node
import 'colors';
import ora from 'ora';
import program from 'commander';

import './util/terminate';
import checkSystem from './util/check-system';

const checker = ora('Checking your System').start();
checkSystem()
  .then((goodSystem) => {
    checker.succeed();
    if (!goodSystem) {
      console.error(('It looks like you are missing some dependencies you need to get Electron running.\n' +
                    'Make sure you have git installed and node.js version 4.0.0+').red);
      process.exit(1);
    }

    program
      .version(require('../package.json').version)
      .command('init', 'Initialize a new Electron application')
      .command('lint', 'Lints the current Electron application')
      .command('package', 'Package the current Electron application')
      .command('start', 'Start the current Electron application')
      .parse(process.argv);
  });
