import { api, InitOptions } from '@electron-forge/core';
import { program } from 'commander';

import './util/terminate';
import packageJSON from '../package.json';

import { resolveWorkingDir } from './util/resolve-working-dir';

program
  .version(packageJSON.version, '-V, --version', 'Output the current version.')
  .helpOption('-h, --help', 'Output usage information.')
  .argument('[dir]', 'Directory to initialize the project in. (default: current directory)')
  .option('-t, --template [name]', 'Name of the Forge template to use.', 'base')
  .option('-c, --copy-ci-files', 'Whether to copy the templated CI files.', false)
  .option('-f, --force', 'Whether to overwrite an existing directory.', false)
  .option('--skip-git', 'Skip initializing a git repository in the initialized project.', false)
  .action(async (dir) => {
    const workingDir = resolveWorkingDir(dir, false);

    const options = program.opts();

    const initOpts: InitOptions = {
      dir: workingDir,
      interactive: true,
      copyCIFiles: !!options.copyCiFiles,
      force: !!options.force,
      skipGit: !!options.skipGit,
    };
    if (options.template) initOpts.template = options.template;

    await api.init(initOpts);
  })
  .parse(process.argv);
