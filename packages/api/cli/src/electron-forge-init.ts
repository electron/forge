import path from 'path';

import { api, InitOptions } from '@electron-forge/core';
import program from 'commander';
import fs from 'fs-extra';

import './util/terminate';
import workingDir from './util/working-dir';

(async () => {
  let dir = process.cwd();
  program
    .version((await fs.readJson(path.resolve(__dirname, '../package.json'))).version)
    .arguments('[name]')
    .option('-t, --template [name]', 'Name of the Forge template to use')
    .option('-c, --copy-ci-files', 'Whether to copy the templated CI files (defaults to false)', false)
    .option('-f, --force', 'Whether to overwrite an existing directory (defaults to false)', false)
    .action((name) => {
      dir = workingDir(dir, name, false);
    })
    .parse(process.argv);

  const initOpts: InitOptions = {
    dir,
    interactive: true,
    copyCIFiles: !!program.copyCiFiles,
    force: !!program.force,
  };
  if (program.template) initOpts.template = program.template;

  await api.init(initOpts);
})();
