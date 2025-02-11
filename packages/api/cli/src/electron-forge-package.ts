import { initializeProxy } from '@electron/get';
import { api, PackageOptions } from '@electron-forge/core';
import { program } from 'commander';

import './util/terminate';
import packageJSON from '../package.json';

import workingDir from './util/working-dir';

(async () => {
  let dir: string = process.cwd();
  program
    .version(packageJSON.version, '-V, --version', 'Output the current version')
    .arguments('[cwd]')
    .option('-a, --arch [arch]', 'Target architecture')
    .option('-p, --platform [platform]', 'Target build platform')
    .helpOption('-h, --help', 'Output usage information')
    .action((cwd) => {
      dir = workingDir(dir, cwd);
    })
    .parse(process.argv);

  const options = program.opts();

  initializeProxy();

  const packageOpts: PackageOptions = {
    dir,
    interactive: true,
  };
  if (options.arch) packageOpts.arch = options.arch;
  if (options.platform) packageOpts.platform = options.platform;

  await api.package(packageOpts);
})();
