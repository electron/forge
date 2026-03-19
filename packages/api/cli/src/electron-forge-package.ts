import url from 'node:url';

import type { PackageOptions } from '@electron-forge/core';
import { resolveWorkingDir } from '@electron-forge/core-utils';
import { createCommand } from 'commander';

import packageJSON from '../package.json' with { type: 'json' };

export function getPackageOptions(argv: string[]): PackageOptions {
  let workingDir: string;
  const cmd = createCommand();
  cmd
    .version(packageJSON.version, '-V, --version', 'Output the current version')
    .helpOption('-h, --help', 'Output usage information')
    .argument(
      '[dir]',
      'Directory to run the command in. (default: current directory)',
    )
    .option('-a, --arch [arch]', 'Target build architecture')
    .option('-p, --platform [platform]', 'Target build platform')
    .action((dir) => {
      workingDir = resolveWorkingDir(dir);
    })
    .parse(argv);

  const options = cmd.opts();

  const packageOpts: PackageOptions = {
    dir: workingDir!,
    interactive: true,
  };
  if (options.arch) packageOpts.arch = options.arch;
  if (options.platform) packageOpts.platform = options.platform;

  return packageOpts;
}

// NOTE: this is a hack that exists because Node.js didn't add import.meta.main
// support until 22.18.0. We should bump up the engines and get that fix before
// we go to stable.
// ref https://2ality.com/2022/07/nodejs-esm-main.html
if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await import('./util/terminate.js');
    const { initializeProxy } = await import('@electron/get');
    const { api } = await import('@electron-forge/core');

    const packageOpts = getPackageOptions(process.argv);

    initializeProxy();

    await api.package(packageOpts);
  }
}
