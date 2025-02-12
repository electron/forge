import { initializeProxy } from '@electron/get';
import { api, MakeOptions } from '@electron-forge/core';
import { program } from 'commander';

import './util/terminate';
import packageJSON from '../package.json';

import workingDir from './util/working-dir';

export async function getMakeOptions(): Promise<MakeOptions> {
  let dir = process.cwd();
  program
    .version(packageJSON.version, '-V, --version', 'Output the current version')
    .arguments('[cwd]')
    .option('--skip-package', 'Assume the app is already packaged')
    .option('-a, --arch [arch]', 'Target architecture')
    .option('-p, --platform [platform]', 'Target build platform')
    .option('--targets [targets]', 'Override your make targets for this run')
    .helpOption('-h, --help', 'Output usage information')
    .allowUnknownOption(true)
    .action((cwd) => {
      dir = workingDir(dir, cwd);
    })
    .parse(process.argv);

  const options = program.opts();

  const makeOpts: MakeOptions = {
    dir,
    interactive: true,
    skipPackage: options.skipPackage,
  };
  if (options.targets) makeOpts.overrideTargets = options.targets.split(',');
  if (options.arch) makeOpts.arch = options.arch;
  if (options.platform) makeOpts.platform = options.platform;

  return makeOpts;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (require.main === module || (global as any).__LINKED_FORGE__) {
  (async () => {
    const makeOpts = await getMakeOptions();

    initializeProxy();

    await api.make(makeOpts);
  })();
}
