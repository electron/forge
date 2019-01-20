import { api, PublishOptions } from '@electron-forge/core';

import createProgram from './util/commander';
import './util/terminate';
import { getMakeOptions } from './electron-forge-make';

(async () => {
  let dir = process.cwd();
  const program = await createProgram();
  program
    .arguments('[cwd]')
    .option('--target [target[,target...]]', 'The comma-separated deployment targets, defaults to "github"')
    .option('--dry-run', 'Triggers a publish dry run which saves state and doesn\'t upload anything')
    .option('--from-dry-run', 'Attempts to publish artifacts from the last saved dry run')
    .allowUnknownOption(true)
    .action((cwd) => { dir = program.workingDir(dir, cwd); })
    .parse(process.argv);

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
