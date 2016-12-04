import debug from 'debug';
import path from 'path';
import program from 'commander';

import initDirectory from './init/init-directory';
import initGit from './init/init-git';
import initNPM from './init/init-npm';
import initStandardFix from './init/init-standard-fix';
import initStarter from './init/init-starter-files';

import './util/terminate';

const d = debug('electron-forge:init');

const main = async () => {
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[name]')
    .option('-l, --lintstyle [style]', 'Linting standard to follow.  Can be "airbnb" or "standard"', 'airbnb')
    .action((name) => {
      if (!name) return;
      if (path.isAbsolute(name)) {
        dir = name;
      } else {
        dir = path.resolve(dir, name);
      }
    })
    .parse(process.argv);

  d(`Initializing in: ${dir}`);
  program.lintstyle = program.lintstyle.toLowerCase();
  if (!['airbnb', 'standard'].includes(program.lintstyle)) {
    d(`Unrecognized lintstyle argument: '${program.lintstyle}' -- defaulting to 'airbnb'`);
    program.lintstyle = 'airbnb';
  }

  await initDirectory(dir);
  await initGit(dir);
  await initNPM(dir, program.lintstyle);
  await initStarter(dir, program.lintstyle);
  if (program.lintstyle === 'standard') {
    await initStandardFix(dir);
  }
};

main();
