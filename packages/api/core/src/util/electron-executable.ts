import path from 'node:path';

import { getElectronModulePath } from '@electron-forge/core-utils';
import logSymbols from 'log-symbols';

type PackageJSON = Record<string, unknown>;

export default async function locateElectronExecutable(dir: string, packageJSON: PackageJSON): Promise<string> {
  const electronModulePath: string | undefined = await getElectronModulePath(dir, packageJSON);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let electronExecPath = require(electronModulePath || path.resolve(dir, 'node_modules/electron'));

  if (typeof electronExecPath !== 'string') {
    console.warn(logSymbols.warning, 'Returned Electron executable path is not a string, defaulting to a hardcoded location. Value:', electronExecPath);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    electronExecPath = require(path.resolve(dir, 'node_modules/electron'));
  }

  return electronExecPath;
}
