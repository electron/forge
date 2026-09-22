import url from 'node:url';
import { styleText } from 'node:util';

import { initializeProxy } from '@electron/get';
import { api, MakeOptions } from '@electron-forge/core';
import { resolveWorkingDir } from '@electron-forge/core-utils';
import { Option, program } from 'commander';

import './util/terminate.js';
import packageJSON from '../package.json' with { type: 'json' };

export async function getMakeOptions(): Promise<MakeOptions> {
  let workingDir: string;
  program
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
      '--from-package',
      `Make distributables from the output of a previous ${styleText('green', 'package')} run, instead of packaging the Electron application again.`,
    )
    // `--skip-package` is deprecated. It is hidden from the help output and
    // prints a deprecation warning when used.
    .addOption(
      new Option(
        '--skip-package',
        'Deprecated: use --from-package instead.',
      ).hideHelp(),
    )
    .option('-a, --arch [arch]', 'Target build architecture.', process.arch)
    .option(
      '-p, --platform [platform]',
      'Target build platform.',
      process.platform,
    )
    .option(
      '--targets [targets]',
      `Override your ${styleText('green', 'make')} targets for this run.`,
    )
    .allowUnknownOption(true)
    .action((dir) => {
      workingDir = resolveWorkingDir(dir, false);
    })
    .parse(process.argv);

  const options = program.opts();

  if (options.skipPackage) {
    console.error(
      styleText('yellow', '⚠'),
      '`--skip-package` is deprecated and will be removed in a future major version; use `--from-package` instead.',
    );
  }

  const makeOpts: MakeOptions = {
    dir: workingDir!,
    interactive: true,
    fromPackage: Boolean(options.fromPackage || options.skipPackage),
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
      const makeOpts = await getMakeOptions();

      initializeProxy();

      await api.make(makeOpts);
    })();
  }
}
