import { PMDetails, spawnPackageManager } from '@electron-forge/core-utils';
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

export default async (pm: PMDetails, dir: string, deps: string[], depType = DepType.PROD, versionRestriction = DepVersionRestriction.RANGE): Promise<void> => {
  d('installing', JSON.stringify(deps), 'in:', dir, `depType=${depType},versionRestriction=${versionRestriction},withPackageManager=${pm.executable}`);
  if (deps.length === 0) {
    d('nothing to install, stopping immediately');
    return Promise.resolve();
  }
  const cmd = [pm.install].concat(deps);
  if (depType === DepType.DEV) cmd.push(pm.dev);
  if (versionRestriction === DepVersionRestriction.EXACT) cmd.push(pm.exact);

  d('executing', JSON.stringify(cmd), 'in:', dir);
  try {
    await spawnPackageManager(pm, cmd, {
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
