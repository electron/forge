import path from 'path';
import program from 'commander';

import './util/terminate';
import { init } from './api';

(async () => {
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[name]')
    .option('-t, --template [name]', 'Name of the forge template to use')
    .option('-l, --lintStyle [style]', 'Linting standard to follow.  For the default template it can be "airbnb" or "standard"', 'airbnb')
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
    lintStyle: program.lintStyle,
    copyCIFiles: !!program.copyCiFiles,
  };
  if (program.template) initOpts.template = program.template;

  await init(initOpts);
})();
