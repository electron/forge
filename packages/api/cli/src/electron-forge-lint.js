import { lint } from '@electron-forge/core';

import fs from 'fs';
import path from 'path';
import program from 'commander';

import './util/terminate';

(async () => {
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

  await lint({
    dir,
    interactive: true,
  });
})();
