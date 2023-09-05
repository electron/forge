#!/usr/bin/env node
// This file requires a shebang above. If it is missing, this is an error.

import chalk from 'chalk';
import program from 'commander';
import { Listr } from 'listr2';

import './util/terminate';

import { checkSystem } from './util/check-system';

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
  .command('start', 'Start the current Electron application in development mode')
  .command('package', 'Package the current Electron application')
  .command('make', 'Generate distributables for the current Electron application')
  .command('publish', 'Publish the current Electron application')
  .on('command:*', (commands) => {
    if (!program._execs.has(commands[0])) {
      console.error();
      console.error(chalk.red(`Unknown command "${program.args.join(' ')}".`));
      console.error('See --help for a list of available commands.');
      process.exit(1);
    }
  });

(async () => {
  const runner = new Listr<never>(
    [
      {
        title: 'Checking your system',
        task: async (_, task) => {
          return await checkSystem(task);
        },
      },
    ],
    {
      concurrent: false,
      exitOnError: false,
    }
  );

  await runner.run();

  if (runner.err.length) {
    console.error(
      chalk.red(`\nIt looks like you are missing some dependencies you need to get Electron running.
Make sure you have git installed and Node.js version ${metadata.engines.node}`)
    );
    process.exit(1);
  }

  program.parse(process.argv);
})();
