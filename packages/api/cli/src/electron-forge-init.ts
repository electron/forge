import { api, InitOptions } from '@electron-forge/core';

import createProgram, { workingDir } from './util/commander';
import './util/terminate';

(async () => {
  let dir = process.cwd();
  const program = await createProgram();
  program
    .arguments('[name]')
    .option('-t, --template [name]', 'Name of the forge template to use')
    .option('-c, --copy-ci-files', 'Whether to copy the templated CI files (defaults to false)', false)
    .action((name) => { dir = workingDir(dir, name, false); })
    .parse(process.argv);

  const initOpts: InitOptions = {
    dir,
    interactive: true,
    copyCIFiles: !!program.copyCiFiles,
  };
  if (program.template) initOpts.template = program.template;

  await api.init(initOpts);
})();
