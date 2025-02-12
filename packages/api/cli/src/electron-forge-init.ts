import { api, InitOptions } from '@electron-forge/core';
import { program } from 'commander';

import './util/terminate';
import packageJSON from '../package.json';

import workingDir from './util/working-dir';

(async () => {
  let dir = process.cwd();
  program
    .version(packageJSON.version, '-V, --version', 'Output the current version')
    .arguments('[name]')
    .option('-t, --template [name]', 'Name of the Forge template to use')
    .option('-c, --copy-ci-files', 'Whether to copy the templated CI files', false)
    .option('-f, --force', 'Whether to overwrite an existing directory', false)
    .helpOption('-h, --help', 'Output usage information')
    .action((name) => {
      dir = workingDir(dir, name, false);
    })
    .parse(process.argv);

  const options = program.opts();

  const initOpts: InitOptions = {
    dir,
    interactive: true,
    copyCIFiles: !!options.copyCiFiles,
    force: !!options.force,
  };
  if (options.template) initOpts.template = options.template;

  await api.init(initOpts);
})();
