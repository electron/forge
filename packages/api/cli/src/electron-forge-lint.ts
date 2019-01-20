import { api } from '@electron-forge/core';

import createProgram, { workingDir } from './util/commander';
import './util/terminate';

(async () => {
  let dir = process.cwd();
  (await createProgram())
    .arguments('[cwd]')
    .action((cwd) => { dir = workingDir(dir, cwd); })
    .parse(process.argv);

  await api.lint({
    dir,
    interactive: true,
  });
})();
