import url from 'node:url';

import type { StartOptions } from '@electron-forge/core';
import { resolveWorkingDir } from '@electron-forge/core-utils';
import type { ElectronProcess } from '@electron-forge/shared-types';
import { createCommand, Option } from 'commander';

import packageJSON from '../package.json' with { type: 'json' };

export function getStartOptions(argv: string[]): StartOptions {
  let commandArgs = argv;
  let appArgs: string[] | undefined;

  const doubleDashIndex = argv.indexOf('--');
  if (doubleDashIndex !== -1) {
    commandArgs = argv.slice(0, doubleDashIndex);
    appArgs = argv.slice(doubleDashIndex + 1);
  }

  let dir: string;
  const cmd = createCommand();
  cmd
    .version(
      packageJSON.version,
      '-V, --version',
      'Output the current version.',
    )
    .helpOption('-h, --help', 'Output usage information.')
    .argument(
      '[dir]',
      'Directory to run the command in. (default: current directory)',
    )
    .option(
      '-p, --app-path <path>',
      'Path to the Electron app to launch. (default: current directory)',
    )
    .option('-l, --enable-logging', 'Enable internal Electron logging.')
    .option('-n, --run-as-node', 'Run the Electron app as a Node.JS script.')
    .addOption(new Option('--vscode').hideHelp()) // Used to enable arg transformation for debugging Electron through VSCode. Hidden from users.
    .option(
      '-i, --inspect-electron',
      'Run Electron in inspect mode to allow debugging the main process.',
    )
    .option(
      '--inspect-brk-electron',
      'Run Electron in inspect-brk mode to allow debugging the main process.',
    )
    .addHelpText(
      'after',
      `
      Any arguments found after "--" will be passed to the Electron app. For example...

          $ npx electron-forge start /path/to/project --enable-logging -- -d -f foo.txt

      ...will pass the arguments "-d -f foo.txt" to the Electron app.`,
    )
    .action((targetDir: string) => {
      dir = resolveWorkingDir(targetDir);
    })
    .parse(commandArgs);

  const options = cmd.opts();

  const opts: StartOptions = {
    dir: dir!,
    interactive: true,
    enableLogging: !!options.enableLogging,
    runAsNode: !!options.runAsNode,
    inspect: !!options.inspectElectron,
    inspectBrk: !!options.inspectBrkElectron,
  };

  if (options.vscode && appArgs) {
    // Args are in the format ~arg~ so we need to strip the "~"
    appArgs = appArgs
      .map((arg) => arg.substr(1, arg.length - 2))
      .filter((arg) => arg.length > 0);
  }

  if (options.appPath) opts.appPath = options.appPath;
  if (appArgs) opts.args = appArgs;

  return opts;
}

// NOTE: this is a hack that exists because Node.js didn't add import.meta.main
// support until 22.18.0. We should bump up the engines and get that fix before
// we go to stable.
// ref https://2ality.com/2022/07/nodejs-esm-main.html
if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await import('./util/terminate.js');
    const { api } = await import('@electron-forge/core');

    const opts = getStartOptions(process.argv);

    const spawned = await api.start(opts);

    await new Promise<void>((resolve) => {
      const listenForExit = (child: ElectronProcess) => {
        // Why: changing to const causes TypeScript compilation to fail.
        /* eslint-disable prefer-const */
        let onExit: NodeJS.ExitListener;
        let onRestart: (newChild: ElectronProcess) => void;
        /* eslint-enable prefer-const */
        const removeListeners = () => {
          child.removeListener('exit', onExit);
          child.removeListener('restarted', onRestart);
        };
        onExit = (code: number) => {
          removeListeners();
          if (spawned.restarted) return;
          if (code !== 0) {
            process.exit(code);
          }
          resolve();
        };
        onRestart = (newChild: ElectronProcess) => {
          removeListeners();
          listenForExit(newChild);
        };
        child.on('exit', onExit);
        child.on('restarted', onRestart);
      };
      listenForExit(spawned as ElectronProcess);
    });
  }
}
