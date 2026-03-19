import url from 'node:url';

import type { MakeOptions } from '@electron-forge/core';
import { resolveWorkingDir } from '@electron-forge/core-utils';
import chalk from 'chalk';
import { createCommand } from 'commander';

import packageJSON from '../package.json' with { type: 'json' };

export function getMakeOptions(argv: string[]): MakeOptions {
  let workingDir: string;
  const cmd = createCommand();
  cmd
    .version(
      packageJSON.version,
      '-V, --version',
      'Output the current version.',
    )
    .helpOption('-h, --help', 'Output usage information.')
    .argument(
      '[dir]',
      'Directory to run the command in. (default: current directory)',
    )
    .option(
      '--skip-package',
      `Skip packaging the Electron application, and use the output from a previous ${chalk.green('package')} run instead.`,
    )
    .option('-a, --arch [arch]', 'Target build architecture.', process.arch)
    .option(
      '-p, --platform [platform]',
      'Target build platform.',
      process.platform,
    )
    .option(
      '--targets [targets]',
      `Override your ${chalk.green('make')} targets for this run.`,
    )
    .allowUnknownOption(true)
    .action((dir) => {
      workingDir = resolveWorkingDir(dir, false);
    })
    .parse(argv);

  const options = cmd.opts();

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

// NOTE: this is a hack that exists because Node.js didn't add import.meta.main
// support until 22.18.0. We should bump up the engines and get that fix before
// we go to stable.
// ref https://2ality.com/2022/07/nodejs-esm-main.html
if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    (async () => {
      await import('./util/terminate.js');
      const { initializeProxy } = await import('@electron/get');
      const { api } = await import('@electron-forge/core');

      const makeOpts = getMakeOptions(process.argv);

      initializeProxy();

      await api.make(makeOpts);
    })();
  }
}
