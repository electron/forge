import 'colors';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';
import ora from 'ora';
import { spawn as yarnOrNPMSpawn } from 'yarn-or-npm';

import './util/terminate';
import resolveDir from './util/resolve-dir';

const main = async () => {
  const lintSpinner = ora('Linting Application').start();
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

  dir = await resolveDir(dir);
  if (!dir) {
    lintSpinner.fail();
    console.error('Failed to locate lintable Electron application'.red);
    if (global._resolveError) global._resolveError();
    process.exit(1);
  }

  const child = yarnOrNPMSpawn(['run', 'lint', '--', '--color'], {
    cwd: dir,
  });
  const output = [];
  child.stdout.on('data', data => output.push(data.toString()));
  child.stderr.on('data', data => output.push(data.toString().red));
  child.on('exit', (code) => {
    if (code !== 0) lintSpinner.fail();
    if (code === 0) lintSpinner.succeed();
    output.forEach(data => process.stdout.write(data));
    if (code !== 0) process.exit(code);
  });
};

main();
