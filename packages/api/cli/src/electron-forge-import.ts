import { api } from '@electron-forge/core';

import createProgram, { workingDir } from './util/commander';
import './util/terminate';

(async () => {
  let dir = process.cwd();
  (await createProgram())
    .arguments('[name]')
    .action((name) => { dir = workingDir(dir, name, false); })
    .parse(process.argv);

  await api.import({
    dir,
    interactive: true,
  });
})();
