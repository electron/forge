import 'colors';
import { spawn } from 'child_process';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';
import ora from 'ora';

import resolveDir from './util/resolve-dir';

const main = async () => {
  const lintSpinner = ora('Linting Application').start();
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
    console.error('Failed to locate lintable Electron application'.red);
    lintSpinner.fail();
    process.exit(1);
  }

  const child = spawn(`${process.platform === 'win32' ? 'npm.cmd' : 'npm'}`, ['run', 'lint'], {
    cwd: dir,
  });
  const output = [];
  child.stdout.on('data', data => output.push(data.toString()));
  child.stderr.on('data', data => output.push(data.toString().red));
  child.on('exit', (code) => {
    if (code !== 0) lintSpinner.fail();
    if (code === 0) lintSpinner.succeed();
    output.forEach(data => process.stdout.write(data));
  });
};

main();
