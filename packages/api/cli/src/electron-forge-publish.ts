import { initializeProxy } from '@electron/get';
import { api, PublishOptions } from '@electron-forge/core';
import chalk from 'chalk';
import { program } from 'commander';

import './util/terminate';
import packageJSON from '../package.json';

import { getMakeOptions } from './electron-forge-make';
import { resolveWorkingDir } from './util/resolve-working-dir';

program
  .version(packageJSON.version, '-V, --version', 'Output the current version.')
  .helpOption('-h, --help', 'Output usage information.')
  .argument('[dir]', 'Directory to run the command in. (default: current directory)')
  .option('--target [target[,target...]]', 'A comma-separated list of deployment targets. (default: all publishers in your Forge config)')
  .option('--dry-run', `Run the ${chalk.green('make')} command and save publish metadata without uploading anything.`)
  .option('--from-dry-run', 'Publish artifacts from the last saved dry run.')
  .allowUnknownOption(true)
  .action(async (targetDir) => {
    const dir = resolveWorkingDir(targetDir);
    const options = program.opts();

    initializeProxy();

    const publishOpts: PublishOptions = {
      dir,
      interactive: true,
      dryRun: options.dryRun,
      dryRunResume: options.fromDryRun,
    };
    if (options.target) publishOpts.publishTargets = options.target.split(',');

    publishOpts.makeOptions = await getMakeOptions();

    await api.publish(publishOpts);
  })
  .parse(process.argv);
