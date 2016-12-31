import 'colors';
import { spawn } from 'child_process';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';

import './util/terminate';
import asyncOra from './util/ora-handler';
import readPackageJSON from './util/read-package-json';
import rebuild from './util/rebuild';
import resolveDir from './util/resolve-dir';

const main = async () => {
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

  await asyncOra('Locating Application', async () => {
    dir = await resolveDir(dir);
    if (!dir) {
      // eslint-disable-next-line no-throw-literal
      throw 'Failed to locate startable Electron application';
    }
  });

  const packageJSON = await readPackageJSON(dir);

  await rebuild(dir, packageJSON.devDependencies['electron-prebuilt-compile'], process.platform, process.arch);

  const spawnOpts = {
    cwd: dir,
    stdio: 'inherit',
    env: Object.assign({}, process.env, program.enableLogging ? {
      ELECTRON_ENABLE_LOGGING: true,
      ELECTRON_ENABLE_STACK_DUMPING: true,
    } : {}),
  };
  await asyncOra('Launching Application', async () => {
    if (process.platform === 'win32') {
      spawn(path.resolve(dir, 'node_modules/.bin/electron.cmd'), ['.'].concat(process.argv.slice(2)), spawnOpts);
    } else {
      spawn(path.resolve(dir, 'node_modules/.bin/electron'), ['.'].concat(process.argv.slice(2)), spawnOpts);
    }
  });
};

main();
