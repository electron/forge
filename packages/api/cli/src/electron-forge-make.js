import { make } from '@electron-forge/core';

import fs from 'fs-extra';
import path from 'path';
import program from 'commander';

import './util/terminate';

// eslint-disable-next-line import/prefer-default-export
export const getMakeOptions = () => {
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('--skip-package', 'Assume the app is already packaged')
    .option('-a, --arch [arch]', 'Target architecture')
    .option('-p, --platform [platform]', 'Target build platform')
    .option('--targets [targets]', 'Override your make targets for this run')
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

  const makeOpts = {
    dir,
    interactive: true,
    skipPackage: program.skipPackage,
  };
  if (program.targets) makeOpts.overrideTargets = program.targets.split(',');
  if (program.arch) makeOpts.arch = program.arch;
  if (program.platform) makeOpts.platform = program.platform;

  return makeOpts;
};

if (process.mainModule === module || global.__LINKED_FORGE__) {
  (async () => {
    const makeOpts = getMakeOptions();

    await make(makeOpts);
  })();
}
