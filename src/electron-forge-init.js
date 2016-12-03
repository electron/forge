import path from 'path';
import program from 'commander';

import initDirectory from './init/init-directory';
import initGit from './init/init-git';
import initNPM from './init/init-npm';
import initStarter from './init/init-starter-files';

import './util/terminate';

const main = async () => {
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[name]')
    .option('-l, --lintstyle [style]', 'Linting standard to follow.  Can be "airbnb" or "standard"', 'airbnb')
    .action((name) => {
      if (name) dir = path.resolve(dir, name);
    })
    .parse(process.argv);

  program.lintstyle = program.lintstyle.toLowerCase();
  if (!['airbnb', 'standard'].includes(program.lintstyle)) program.lintstyle = 'airbnb';

  await initDirectory(dir);
  await initGit(dir);
  await initNPM(dir, program.lintstyle);
  await initStarter(dir, program.lintstyle);
};

main();
