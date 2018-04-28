import { api } from '@electron-forge/core';

import path from 'path';
import program from 'commander';

import './util/terminate';

(async () => {
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[name]')
    .action((name) => {
      if (!name) return;
      if (path.isAbsolute(name)) {
        dir = name;
      } else {
        dir = path.resolve(dir, name);
      }
    })
    .parse(process.argv);

  await api.import({
    dir,
    interactive: true,
  });
})();
