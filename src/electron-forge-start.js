import 'colors';
import { spawn } from 'child_process';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';
import ora from 'ora';

import './util/terminate';
import readPackageJSON from './util/read-package-json';
import rebuild from './util/rebuild';
import resolveDir from './util/resolve-dir';

const main = async () => {
  const locateSpinner = ora.ora('Locating Application').start();
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
    .parse(process.argv.slice(0, 2));

  dir = await resolveDir(dir);
  if (!dir) {
    locateSpinner.fail();
    console.error('Failed to locate startable Electron application'.red);
    if (global._resolveError) global._resolveError();
    process.exit(1);
  }
  locateSpinner.succeed();

  const packageJSON = await readPackageJSON(dir);

  await rebuild(dir, packageJSON.devDependencies['electron-prebuilt-compile'], process.platform, process.arch);

  const startSpinner = ora.ora('Launching Application').start();

  const spawnOpts = {
    cwd: dir,
    stdio: 'inherit',
    env: Object.assign({}, process.env, program.enableLogging ? {
      ELECTRON_ENABLE_LOGGING: true,
      ELECTRON_ENABLE_STACK_DUMPING: true,
    } : {}),
  };
  if (process.platform === 'win32') {
    spawn(path.resolve(dir, 'node_modules/.bin/electron.cmd'), ['.'].concat(process.argv.slice(2)), spawnOpts);
  } else {
    spawn(path.resolve(dir, 'node_modules/.bin/electron'), ['.'].concat(process.argv.slice(2)), spawnOpts);
  }

  startSpinner.succeed();
};

main();
