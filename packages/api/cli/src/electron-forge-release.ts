import url from 'node:url';
import { styleText } from 'node:util';

import { initializeProxy } from '@electron/get';
import { api, ReleaseOptions } from '@electron-forge/core';
import { resolveWorkingDir } from '@electron-forge/core-utils';
import { Option, program } from 'commander';

import './util/terminate.js';
import packageJSON from '../package.json' with { type: 'json' };

import { getMakeOptions } from './electron-forge-make.js';

export async function runRelease(): Promise<void> {
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
      '--target [target[,target...]]',
      'A comma-separated list of deployment targets. (default: all publishers in your Forge config)',
    )
    .option(
      '--skip-make',
      `Skip making the Electron application, and release the artifacts from a previous ${styleText('green', 'make')} run instead.`,
    )
    // `--dry-run` and `--from-dry-run` are deprecated. They are hidden from
    // the help output and print a deprecation warning when used.
    .addOption(
      new Option(
        '--dry-run',
        `Deprecated: run the ${styleText('green', 'make')} command instead.`,
      ).hideHelp(),
    )
    .addOption(
      new Option(
        '--from-dry-run',
        'Deprecated: use --skip-make instead.',
      ).hideHelp(),
    )
    .allowUnknownOption(true)
    .action(async (targetDir) => {
      const dir = resolveWorkingDir(targetDir);
      const options = program.opts();

      if (options.dryRun) {
        console.error(
          styleText('yellow', '⚠'),
          '`--dry-run` is deprecated and will be removed in a future major version. The `make` command now always saves its results, so run `electron-forge make` instead and then `electron-forge release --skip-make` to release them.',
        );
      }
      if (options.fromDryRun) {
        console.error(
          styleText('yellow', '⚠'),
          '`--from-dry-run` is deprecated and will be removed in a future major version; use `--skip-make` instead.',
        );
      }

      initializeProxy();

      const releaseOpts: ReleaseOptions = {
        dir,
        interactive: true,
        skipMake: Boolean(options.skipMake || options.fromDryRun),
        dryRun: Boolean(options.dryRun),
      };
      if (options.target)
        releaseOpts.publishTargets = options.target.split(',');

      releaseOpts.makeOptions = await getMakeOptions();

      await api.release(releaseOpts);
    })
    .parse(process.argv);
}

// NOTE: this is a hack that exists because Node.js didn't add import.meta.main
// support until 22.18.0. We should bump up the engines and get that fix before
// we go to stable.
// ref https://2ality.com/2022/07/nodejs-esm-main.html
if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await runRelease();
  }
}
