import { init } from '@electron-forge/core';

import path from 'path';
import program from 'commander';

import './util/terminate';

(async () => {
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[name]')
    .option('-t, --template [name]', 'Name of the forge template to use')
    .option('-c, --copy-ci-files', 'Whether to copy the templated CI files (defaults to false)', false)
    .action((name) => {
      if (!name) return;
      if (path.isAbsolute(name)) {
        dir = name;
      } else {
        dir = path.resolve(dir, name);
      }
    })
    .parse(process.argv);

  const initOpts = {
    dir,
    interactive: true,
    copyCIFiles: !!program.copyCiFiles,
  };
  if (program.template) initOpts.template = program.template;

  await init(initOpts);
})();
