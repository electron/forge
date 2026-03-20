import url from 'node:url';

import type { PublishOptions } from '@electron-forge/core';
import { resolveWorkingDir } from '@electron-forge/core-utils';
import chalk from 'chalk';
import { createCommand } from 'commander';

import packageJSON from '../package.json' with { type: 'json' };

import { getMakeOptions } from './electron-forge-make.js';

export function getPublishOptions(argv: string[]): PublishOptions {
  let dir: string;
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
      '--target [target[,target...]]',
      'A comma-separated list of deployment targets. (default: all publishers in your Forge config)',
    )
    .option(
      '--dry-run',
      `Run the ${chalk.green('make')} command and save publish metadata without uploading anything.`,
    )
    .option('--from-dry-run', 'Publish artifacts from the last saved dry run.')
    .allowUnknownOption(true)
    .action((targetDir) => {
      dir = resolveWorkingDir(targetDir);
    })
    .parse(argv);

  const options = cmd.opts();

  const publishOpts: PublishOptions = {
    dir: dir!,
    interactive: true,
    dryRun: options.dryRun,
    dryRunResume: options.fromDryRun,
  };
  if (options.target) publishOpts.publishTargets = options.target.split(',');

  publishOpts.makeOptions = getMakeOptions(argv);

  return publishOpts;
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

      const publishOpts = getPublishOptions(process.argv);

      initializeProxy();

      await api.publish(publishOpts);
    })();
  }
}
