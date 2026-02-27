import path from 'node:path';

import { getElectronModulePath } from '@electron-forge/core-utils';
import logSymbols from 'log-symbols';

type PackageJSON = Record<string, unknown>;

/**
 * Importing `electron` from within a Node.js environment (outside of Electron) returns
 * the path to the Electron executable.
 *
 * In Electron Forge 8, we use ESM import to do so but need to use the `default` export for interop reasons.
 */
export default async function locateElectronExecutable(
  dir: string,
  packageJSON: PackageJSON,
): Promise<string> {
  const electronModulePath: string | undefined = await getElectronModulePath(
    dir,
    packageJSON,
  );

  const electronModuleEntryPoint = electronModulePath
    ? path.join(electronModulePath, 'index.js')
    : path.resolve(dir, 'node_modules/electron/index.js');
  const { default: electronExecPath } = await import(electronModuleEntryPoint);

  if (typeof electronExecPath === 'string') {
    return electronExecPath;
  } else {
    console.warn(
      logSymbols.warning,
      `Returned Electron executable path (${electronExecPath}) is not a string. Defaulting to node_modules/electron.`,
    );
    return await import(path.resolve(dir, 'node_modules/electron/index.js'));
  }
}
