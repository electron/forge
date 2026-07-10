import url from 'node:url';
import { styleText } from 'node:util';

import { initializeProxy } from '@electron/get';
import { api, ReleaseOptions } from '@electron-forge/core';
import { resolveWorkingDir } from '@electron-forge/core-utils/resolve-working-dir';
import { program } from 'commander';

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
      '--dry-run',
      `Run the ${styleText('green', 'make')} command and save release metadata without uploading anything.`,
    )
    .option('--from-dry-run', 'Release artifacts from the last saved dry run.')
    .allowUnknownOption(true)
    .action(async (targetDir) => {
      const dir = resolveWorkingDir(targetDir);
      const options = program.opts();

      initializeProxy();

      const releaseOpts: ReleaseOptions = {
        dir,
        interactive: true,
        dryRun: options.dryRun,
        dryRunResume: options.fromDryRun,
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
