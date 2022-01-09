import chalk from 'chalk';
import logSymbols from 'log-symbols';
import path from 'path';

import { getElectronModulePath } from './electron-version';

type PackageJSON = Record<string, unknown>;
type Dependencies = Record<string, string>;

export function pluginCompileExists(packageJSON: PackageJSON): boolean {
  if (!packageJSON.devDependencies) {
    return false;
  }

  const pluginCompileName = '@electron-forge/plugin-compile';
  const findPluginCompile = (packageName: string): boolean => packageName === pluginCompileName;

  if (Object.keys(packageJSON.devDependencies as Dependencies).find(findPluginCompile)) {
    return true;
  }

  if (Object.keys((packageJSON.dependencies as Dependencies) || {}).find(findPluginCompile)) {
    // eslint-disable-next-line no-console
    console.warn(logSymbols.warning, chalk.yellow(`${pluginCompileName} was detected in dependencies, it should be in devDependencies`));
    return true;
  }

  return false;
}

export default async function locateElectronExecutable(dir: string, packageJSON: PackageJSON): Promise<string> {
  let electronModulePath: string | undefined = await getElectronModulePath(dir, packageJSON);
  if (electronModulePath?.endsWith('electron-prebuilt-compile') && !pluginCompileExists(packageJSON)) {
    // eslint-disable-next-line no-console
    console.warn(
      logSymbols.warning,
      chalk.yellow(
        'WARNING: found electron-prebuilt-compile without the Electron Forge compile plugin. Please remove the deprecated electron-prebuilt-compile from your devDependencies.'
      )
    );
    electronModulePath = undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-dynamic-require, global-require
  let electronExecPath = require(electronModulePath || path.resolve(dir, 'node_modules/electron'));

  if (typeof electronExecPath !== 'string') {
    // eslint-disable-next-line no-console
    console.warn(logSymbols.warning, 'Returned Electron executable path is not a string, defaulting to a hardcoded location. Value:', electronExecPath);
    // eslint-disable-next-line import/no-dynamic-require, global-require
    electronExecPath = require(path.resolve(dir, 'node_modules/electron'));
  }

  return electronExecPath;
}
