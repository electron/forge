import { initializeProxy } from '@electron/get';
import { api, BundleOptions } from '@electron-forge/core';
import { program } from 'commander';

import './util/terminate';
import packageJSON from '../package.json';

import { resolveWorkingDir } from './util/resolve-working-dir';

program
  .version(packageJSON.version, '-V, --version', 'Output the current version')
  .helpOption('-h, --help', 'Output usage information')
  .argument(
    '[dir]',
    'Directory to run the command in. (default: current directory)',
  )
  .option('-a, --arch [arch]', 'Target build architecture')
  .option('-p, --platform [platform]', 'Target build platform')
  .action(async (dir) => {
    const workingDir = resolveWorkingDir(dir);

    const options = program.opts();

    initializeProxy();

    const bundleOpts: BundleOptions = {
      dir: workingDir,
      interactive: true,
    };
    if (options.arch) bundleOpts.arch = options.arch;
    if (options.platform) bundleOpts.platform = options.platform;

    await api.bundle(bundleOpts);
  })
  .parse(process.argv);
