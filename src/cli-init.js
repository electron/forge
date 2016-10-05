import path from 'path';
import program from 'commander';

import initDirectory from './init/init-directory';
import initGit from './init/init-git';
import initNPM from './init/init-npm';
import initStarter from './init/init-starter-files';

const main = async () => {
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[name]')
    .action((name) => {
      if (name) dir = path.resolve(dir, name);
    })
    .parse(process.argv);

  await initDirectory(dir);
  await initGit(dir);
  await initNPM(dir);
  await initStarter(dir);
};

main();
