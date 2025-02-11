import { initializeProxy } from '@electron/get';
import { api, PublishOptions } from '@electron-forge/core';
import { program } from 'commander';

import './util/terminate';
import packageJSON from '../package.json';

import { getMakeOptions } from './electron-forge-make';
import workingDir from './util/working-dir';

(async () => {
  let dir = process.cwd();
  program
    .version(packageJSON.version, '-V, --version', 'Output the current version')
    .arguments('[cwd]')
    .option('--target [target[,target...]]', 'The comma-separated deployment targets, defaults to "github"')
    .option('--dry-run', "Triggers a publish dry run which saves state and doesn't upload anything")
    .option('--from-dry-run', 'Attempts to publish artifacts from the last saved dry run')
    .helpOption('-h, --help', 'Output usage information')
    .allowUnknownOption(true)
    .action((cwd) => {
      dir = workingDir(dir, cwd);
    })
    .parse(process.argv);

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
})();
