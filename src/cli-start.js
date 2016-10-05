import 'colors';
import { spawn } from 'child_process';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';
import ora from 'ora';

import resolveDir from './util/resolve-dir';

const main = async () => {
  const startSpinner = ora('Launching Application').start();
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
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

  spawn(`${process.platform === 'win32' ? 'npm.cmd' : 'npm'}`, ['start'], {
    cwd: dir,
    stdio: 'inherit',
  });

  startSpinner.succeed();
};

main();
