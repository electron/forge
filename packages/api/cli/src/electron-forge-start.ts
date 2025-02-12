import { api, StartOptions } from '@electron-forge/core';
import { ElectronProcess } from '@electron-forge/shared-types';
import { program } from 'commander';

import './util/terminate';
import packageJSON from '../package.json';

import workingDir from './util/working-dir';

(async () => {
  let commandArgs = process.argv;
  let appArgs;

  const doubleDashIndex = process.argv.indexOf('--');
  if (doubleDashIndex !== -1) {
    commandArgs = process.argv.slice(0, doubleDashIndex);
    appArgs = process.argv.slice(doubleDashIndex + 1);
  }

  let dir = process.cwd();
  program
    .version(packageJSON.version, '-V, --version', 'Output the current version')
    .arguments('[cwd]')
    .option('-p, --app-path <path>', "Override the path to the Electron app to launch (defaults to '.')")
    .option('-l, --enable-logging', 'Enable advanced logging.  This will log internal Electron things')
    .option('-n, --run-as-node', 'Run the Electron app as a Node.JS script')
    .option('--vscode', 'Used to enable arg transformation for debugging Electron through VSCode.  Do not use yourself.')
    .option('-i, --inspect-electron', 'Triggers inspect mode on Electron to allow debugging the main process.  Electron >1.7 only')
    .option('--inspect-brk-electron', 'Triggers inspect-brk mode on Electron to allow debugging the main process.  Electron >1.7 only')
    .addHelpText(
      'after',
      `
      Any arguments found after "--" will be passed to the Electron app. For example...
      
          $ npx electron-forge start /path/to/project --enable-logging -- -d -f foo.txt
                                    
      ...will pass the arguments "-d -f foo.txt" to the Electron app.`
    )
    .passThroughOptions(true) // allows args to be passed down to the Electron executable
    .action((cwd) => {
      dir = workingDir(dir, cwd);
    })
    .parse(commandArgs);

  const options = program.opts();

  const opts: StartOptions = {
    dir,
    interactive: true,
    enableLogging: !!options.enableLogging,
    runAsNode: !!options.runAsNode,
    inspect: !!options.inspectElectron,
    inspectBrk: !!options.inspectBrkElectron,
  };

  if (options.vscode && appArgs) {
    // Args are in the format ~arg~ so we need to strip the "~"
    appArgs = appArgs.map((arg) => arg.substr(1, arg.length - 2)).filter((arg) => arg.length > 0);
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
