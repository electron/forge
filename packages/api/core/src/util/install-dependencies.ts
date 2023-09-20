import { isNpm, isPnpm, isYarn, packageManagerSpawn } from '@electron-forge/core-utils';
import { ExitError } from '@malept/cross-spawn-promise';
import debug from 'debug';

const d = debug('electron-forge:dependency-installer');

export enum DepType {
  PROD = 'PROD',
  DEV = 'DEV',
}

export enum DepVersionRestriction {
  EXACT = 'EXACT',
  RANGE = 'RANGE',
}

export default async (dir: string, deps: string[], depType = DepType.PROD, versionRestriction = DepVersionRestriction.RANGE): Promise<void> => {
  d(
    'installing',
    JSON.stringify(deps),
    'in:',
    dir,
    `depType=${depType},versionRestriction=${versionRestriction}},withYarn=${isYarn()},withNpm=${isNpm()},withPnpm=${isPnpm()}`
  );
  if (deps.length === 0) {
    d('nothing to install, stopping immediately');
    return Promise.resolve();
  }
  /**
   * To install the specified packages as dependencies
   * yarn and pnpm use `add` command
   * npm use `add` as an alias command of `install`
   * for consistency, we use `add` command here
   */
  const cmd = ['add'].concat(deps);
  if (depType === DepType.DEV) cmd.push('-D');
  if (versionRestriction === DepVersionRestriction.EXACT) cmd.push('-E');
  d('executing', JSON.stringify(cmd), 'in:', dir);
  try {
    await packageManagerSpawn(cmd, {
      cwd: dir,
      stdio: 'pipe',
    });
  } catch (err) {
    if (err instanceof ExitError) {
      throw new Error(`Failed to install modules: ${JSON.stringify(deps)}\n\nWith output: ${err.message}\n${err.stderr ? err.stderr.toString() : ''}`);
    } else {
      throw err;
    }
  }
};
