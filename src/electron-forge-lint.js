import 'colors';
import debug from 'debug';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';
import { spawn as yarnOrNPMSpawn } from 'yarn-or-npm';

import './util/terminate';
import asyncOra from './util/ora-handler';
import resolveDir from './util/resolve-dir';

const d = debug('electron-forge:lint');

const main = async () => {
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .action((cwd) => {
      if (!cwd) return;
      if (path.isAbsolute(cwd) && fs.existsSync(cwd)) {
        dir = cwd;
      } else if (fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
      }
    })
    .parse(process.argv);

  await asyncOra('Linting Application', async (lintSpinner) => {
    dir = await resolveDir(dir);
    if (!dir) {
      lintSpinner.fail();
      console.error('Failed to locate lintable Electron application'.red);
      if (global._resolveError) global._resolveError();
      process.exit(1);
    }

    d('executing "run lint -- --color" in dir:', dir);
    const child = yarnOrNPMSpawn(['run', 'lint', '--', '--color'], {
      stdio: process.platform === 'win32' ? 'inherit' : 'pipe',
      cwd: dir,
    });
    const output = [];
    if (process.platform !== 'win32') {
      child.stdout.on('data', data => output.push(data.toString()));
      child.stderr.on('data', data => output.push(data.toString().red));
    }
    child.on('exit', (code) => {
      if (code !== 0) {
        lintSpinner.fail();
        output.forEach(data => process.stdout.write(data));
        process.exit(code);
      }
    });
  });
};

main();
