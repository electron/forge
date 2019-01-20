import { api, InitOptions } from '@electron-forge/core';

import fs from 'fs-extra';
import program from 'commander';

import './util/terminate';
import workingDir from './util/working-dir';

(async () => {
  let dir = process.cwd();
  program
    .version((await fs.readJson('../package.json')).version)
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
