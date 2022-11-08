import path from 'path';

import { api } from '@electron-forge/core';
import program from 'commander';
import fs from 'fs-extra';

import './util/terminate';
import workingDir from './util/working-dir';

(async () => {
  let dir = process.cwd();
  program
    .version((await fs.readJson(path.resolve(__dirname, '../package.json'))).version)
    .arguments('[name]')
    .action((name) => {
      dir = workingDir(dir, name, false);
    })
    .parse(process.argv);

  await api.import({
    dir,
    interactive: true,
  });
})();
