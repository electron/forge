import 'colors';
import { spawn } from 'child_process';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';
import ora from 'ora';
import { spawn as yarnOrNPMSpawn } from 'yarn-or-npm';

import './util/terminate';
import resolveDir from './util/resolve-dir';

const main = async () => {
  const startSpinner = ora('Launching Application').start();
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('-l, --enable-logging', 'Enable advanced logging.  This will log internal Electron things')
    .action((cwd) => {
      if (cwd && fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
      }
    })
    .parse(process.argv);

  dir = await resolveDir(dir);
  if (!dir) {
    console.error('Failed to locate startable Electron application'.red);
    startSpinner.fail();
    process.exit(1);
  }

  yarnOrNPMSpawn(['start'], {
    cwd: dir,
    stdio: 'inherit',
    env: program.enableLogging ? {
      ELECTRON_ENABLE_LOGGING: true,
      ELECTRON_ENABLE_STACK_DUMPING: true,
    } : {},
  });

  startSpinner.succeed();
};

main();
