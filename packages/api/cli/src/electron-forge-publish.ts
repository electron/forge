import path from 'path';

import { api, PublishOptions } from '@electron-forge/core';
import { initializeProxy } from '@electron/get';
import program from 'commander';
import fs from 'fs-extra';

import './util/terminate';
import { getMakeOptions } from './electron-forge-make';
import workingDir from './util/working-dir';

(async () => {
  let dir = process.cwd();
  program
    .version((await fs.readJson(path.resolve(__dirname, '../package.json'))).version)
    .arguments('[cwd]')
    .option('--target [target[,target...]]', 'The comma-separated deployment targets, defaults to "github"')
    .option('--dry-run', "Triggers a publish dry run which saves state and doesn't upload anything")
    .option('--from-dry-run', 'Attempts to publish artifacts from the last saved dry run')
    .allowUnknownOption(true)
    .action((cwd) => {
      dir = workingDir(dir, cwd);
    })
    .parse(process.argv);

  initializeProxy();

  const publishOpts: PublishOptions = {
    dir,
    interactive: true,
    dryRun: program.dryRun,
    dryRunResume: program.fromDryRun,
  };
  if (program.target) publishOpts.publishTargets = program.target.split(',');

  publishOpts.makeOptions = await getMakeOptions();

  await api.publish(publishOpts);
})();
