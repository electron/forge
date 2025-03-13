import { api } from '@electron-forge/core';
import { program } from 'commander';

import './util/terminate';
import packageJSON from '../package.json';

import { resolveWorkingDir } from './util/resolve-working-dir';

program
  .version(packageJSON.version, '-V, --version', 'Output the current version.')
  .helpOption('-h, --help', 'Output usage information.')
  .argument('[dir]', 'Directory of the project to import. (default: current directory)')
  .option('--skip-git', 'Skip initializing a git repository in the imported project.', false)
  .action(async (dir: string) => {
    const workingDir = resolveWorkingDir(dir, false);

    const options = program.opts();

    await api.import({
      dir: workingDir,
      interactive: true,
      skipGit: !!options.skipGit,
    });
  })
  .parse(process.argv);
