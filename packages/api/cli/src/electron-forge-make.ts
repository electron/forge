import { initializeProxy } from '@electron/get';
import { api, MakeOptions } from '@electron-forge/core';
import chalk from 'chalk';
import { program } from 'commander';

import './util/terminate';
import packageJSON from '../package.json';

import { resolveWorkingDir } from './util/resolve-working-dir';

export async function getMakeOptions(): Promise<MakeOptions> {
  let workingDir: string;
  program
    .version(packageJSON.version, '-V, --version', 'Output the current version.')
    .helpOption('-h, --help', 'Output usage information.')
    .argument('[dir]', 'Directory to run the command in. (default: current directory)')
    .option('--skip-package', `Skip packaging the Electron application, and use the output from a previous ${chalk.green('package')} run instead.`)
    .option('-a, --arch [arch]', 'Target build architecture.', process.arch)
    .option('-p, --platform [platform]', 'Target build platform.', process.platform)
    .option('--targets [targets]', `Override your ${chalk.green('make')} targets for this run.`)
    .allowUnknownOption(true)
    .action((dir) => {
      workingDir = resolveWorkingDir(dir, false);
    })
    .parse(process.argv);

  const options = program.opts();

  const makeOpts: MakeOptions = {
    dir: workingDir!,
    interactive: true,
    skipPackage: options.skipPackage,
  };
  if (options.targets) makeOpts.overrideTargets = options.targets.split(',');
  if (options.arch) makeOpts.arch = options.arch;
  if (options.platform) makeOpts.platform = options.platform;

  return makeOpts;
}

if (require.main === module) {
  (async () => {
    const makeOpts = await getMakeOptions();

    initializeProxy();

    await api.make(makeOpts);
  })();
}
