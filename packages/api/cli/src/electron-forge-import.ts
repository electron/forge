import { api } from '@electron-forge/core';
import { program } from 'commander';

import './util/terminate';
import packageJSON from '../package.json';

import workingDir from './util/working-dir';

(async () => {
  let dir = process.cwd();
  program
    .version(packageJSON.version, '-V, --version', 'Output the current version')
    .helpOption('-h, --help', 'Output usage information')
    .arguments('[name]')
    .action((name) => {
      dir = workingDir(dir, name, false);
    })
    .parse(process.argv);

  await api.import({
    dir,
    interactive: true,
  });
})();
