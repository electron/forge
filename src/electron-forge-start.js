import 'colors';
import { spawn } from 'child_process';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';
import ora from 'ora';

import './util/terminate';
import resolveDir from './util/resolve-dir';

const main = async () => {
  const startSpinner = ora.ora('Launching Application').start();
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('-l, --enable-logging', 'Enable advanced logging.  This will log internal Electron things')
    .action((cwd) => {
      if (!cwd) return;
      if (path.isAbsolute(cwd) && fs.existsSync(cwd)) {
        dir = cwd;
      } else if (fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
      }
    })
    .parse(process.argv);

  dir = await resolveDir(dir);
  if (!dir) {
    startSpinner.fail();
    console.error('Failed to locate startable Electron application'.red);
    if (global._resolveError) global._resolveError();
    process.exit(1);
  }

  spawn(process.execPath, [path.resolve(dir, 'node_modules/.bin/electron'), '.'].concat(process.argv.slice(2)), {
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
