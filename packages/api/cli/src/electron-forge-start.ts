import { createRequire } from 'node:module';
import path from 'node:path';

import { api, StartOptions } from '@electron-forge/core';
import { ElectronProcess } from '@electron-forge/shared-types';
import boxen, { Options } from 'boxen';
import chalk from 'chalk';
import { Option, program } from 'commander';
// eslint-disable-next-line n/no-unpublished-import
import updateNotifier from 'update-notifier';

import './util/terminate';
import packageJSON from '../package.json';

import { resolveWorkingDir } from './util/resolve-working-dir';

let userPackage;
try {
  userPackage = createRequire(path.resolve('package.json'))('./package.json');
} catch {
  console.warn(
    `path=${'package.json'} file not found at CWD: path=${process.cwd()}.`,
  );
}
(async () => {
  let commandArgs = process.argv;
  let appArgs;
  const notifier = updateNotifier({
    pkg: packageJSON,
    // Use 0 for debugging.
    updateCheckInterval: 1000 * 60 * 60,
  });
  if (notifier.update) {
    const sitePackagesForUpdate = Object.keys({
      ...userPackage.devDependencies,
    })
      .filter((p) => p.startsWith('@electron-forge'))
      .map((p) => p.concat('@latest'))
      .join(' ');
    const boxenOptions: Options = {
      padding: 1,
      margin: 1,
      align: 'center',
      borderColor: 'cyan',
      borderStyle: {
        topLeft: '╭',
        topRight: '╮',
        bottomLeft: '╰',
        bottomRight: '╯',
        horizontal: '─',
        vertical: '│',
      },
    };
    const forgeUpdateMessage = boxen(
      `Update available ${chalk.dim(`${notifier.update.current}`)} → ${chalk.green(`${notifier.update.latest}`)}

      To upgrade Electron Forge packages to the latest version, execute the following command:
    ${chalk.cyanBright(`npm i ${sitePackagesForUpdate}`)}`,
      boxenOptions,
    );
    console.log(forgeUpdateMessage);
  }

  const doubleDashIndex = process.argv.indexOf('--');
  if (doubleDashIndex !== -1) {
    commandArgs = process.argv.slice(0, doubleDashIndex);
    appArgs = process.argv.slice(doubleDashIndex + 1);
  }

  let dir;
  program
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

  const options = program.opts();

  const opts: StartOptions = {
    dir,
    interactive: process.stdin.isTTY ?? false,
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
})();
