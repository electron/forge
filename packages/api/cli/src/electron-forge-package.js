import { package as packageAPI } from '@electron-forge/core';

import fs from 'fs-extra';
import path from 'path';
import program from 'commander';

import './util/terminate';

(async () => {
  let dir = process.cwd();

  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('-a, --arch [arch]', 'Target architecture')
    .option('-p, --platform [platform]', 'Target build platform')
    .action((cwd) => {
      if (!cwd) return;
      if (path.isAbsolute(cwd) && fs.existsSync(cwd)) {
        dir = cwd;
      } else if (fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
      }
    })
    .parse(process.argv);

  const packageOpts = {
    dir,
    interactive: true,
  };
  if (program.arch) packageOpts.arch = program.arch;
  if (program.platform) packageOpts.platform = program.platform;

  await packageAPI(packageOpts);
})();
