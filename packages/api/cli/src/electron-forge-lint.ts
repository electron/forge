import { api } from '@electron-forge/core';

import fs from 'fs-extra';
import program from 'commander';

import './util/terminate';
import workingDir from './util/working-dir';

(async () => {
  let dir = process.cwd();
  program
    .version((await fs.readJson('../package.json')).version)
    .arguments('[cwd]')
    .action((cwd) => { dir = workingDir(dir, cwd); })
    .parse(process.argv);

  await api.lint({
    dir,
    interactive: true,
  });
})();
