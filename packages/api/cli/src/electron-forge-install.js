import { install } from '@electron-forge/core';

import program from 'commander';

import './util/terminate';

(async () => {
  let repo;

  program
    .version(require('../package.json').version)
    .arguments('[repository]')
    .option('--prerelease', 'Fetch prerelease versions')
    .action((repository) => {
      repo = repository;
    })
    .parse(process.argv);

  await install({
    repo,
    interactive: true,
    prerelease: program.prerelease,
  });
})();
