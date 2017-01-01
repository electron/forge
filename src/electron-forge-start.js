import fs from 'fs-promise';
import path from 'path';
import program from 'commander';

import './util/terminate';
import { start } from './api';

(async () => {
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

  await start({
    dir,
    interactive: true,
    enableLogging: program.enableLogging,
    args: process.argv.slice(2),
  });
})();
