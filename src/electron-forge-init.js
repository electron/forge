import debug from 'debug';
import path from 'path';
import program from 'commander';

import initCustom from './init/init-custom';
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
    .option('-t, --template [name]', 'Name of the forge template to use')
    .option('-l, --lintstyle [style]', 'Linting standard to follow.  For the default template it can be "airbnb" or "standard"', 'airbnb')
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

  if (!program.template) {
    program.lintstyle = program.lintstyle.toLowerCase();
    if (!['airbnb', 'standard'].includes(program.lintstyle)) {
      d(`Unrecognized lintstyle argument: '${program.lintstyle}' -- defaulting to 'airbnb'`);
      program.lintstyle = 'airbnb';
    }
  }

  await initDirectory(dir);
  await initGit(dir);
  await initNPM(dir, program.template ? undefined : program.lintstyle);
  await initStarter(dir, program.template ? undefined : program.lintstyle);
  if (!program.template) {
    if (program.lintstyle === 'standard') {
      await initStandardFix(dir);
    }
  } else {
    await initCustom(dir, program.template, program.lintstyle);
  }
};

main();
