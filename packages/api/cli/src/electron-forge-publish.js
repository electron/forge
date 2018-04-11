import { publish } from '@electron-forge/core';

import fs from 'fs-extra';
import path from 'path';
import program from 'commander';

import './util/terminate';
import { getMakeOptions } from './electron-forge-make';

(async () => {
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('--tag', 'The tag to publish to on GitHub')
    .option('--target [target[,target...]]', 'The comma-separated deployment targets, defaults to "github"')
    .option('--dry-run', 'Triggers a publish dry run which saves state and doesn\'t upload anything')
    .option('--from-dry-run', 'Attempts to publish artifacts from the last saved dry run')
    .allowUnknownOption(true)
    .action((cwd) => {
      if (!cwd) return;
      if (path.isAbsolute(cwd) && fs.existsSync(cwd)) {
        dir = cwd;
      } else if (fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
      }
    })
    .parse(process.argv);

  const publishOpts = {
    dir,
    interactive: true,
    authToken: program.authToken,
    tag: program.tag,
    dryRun: program.dryRun,
    dryRunResume: program.fromDryRun,
  };
  if (program.target) publishOpts.publishTargets = program.target.split(',');

  publishOpts.makeOptions = getMakeOptions();

  await publish(publishOpts);
})();
