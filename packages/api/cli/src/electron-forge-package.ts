import { api, PackageOptions } from '@electron-forge/core';

import createProgram, { workingDir } from './util/commander';
import './util/terminate';

(async () => {
  let dir: string = process.cwd();
  const program = await createProgram();
  program
    .arguments('[cwd]')
    .option('-a, --arch [arch]', 'Target architecture')
    .option('-p, --platform [platform]', 'Target build platform')
    .action((cwd) => { dir = workingDir(dir, cwd); })
    .parse(process.argv);

  const packageOpts: PackageOptions = {
    dir,
    interactive: true,
  };
  if (program.arch) packageOpts.arch = program.arch;
  if (program.platform) packageOpts.platform = program.platform;

  await api.package(packageOpts);
})();
