import path from 'node:path';

import { CrossSpawnArgs, CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import chalk from 'chalk';
import debug from 'debug';
import findUp from 'find-up';
import logSymbols from 'log-symbols';

const d = debug('electron-forge:package-manager');

export type SupportedPackageManager = 'yarn' | 'npm' | 'pnpm';
export type PMDetails = { executable: SupportedPackageManager; version?: string; install: string; dev: string; exact: string };

let hasWarned = false;

/**
 * Supported package managers and the commands and flags they need to install dependencies.
 */
export const PACKAGE_MANAGERS: Record<SupportedPackageManager, PMDetails> = {
  yarn: {
    executable: 'yarn',
    install: 'add',
    dev: '--dev',
    exact: '--exact',
  },
  npm: {
    executable: 'npm',
    install: 'install',
    dev: '--save-dev',
    exact: '--save-exact',
  },
  pnpm: {
    executable: 'pnpm',
    install: 'add',
    dev: '--save-dev',
    exact: '--save-exact',
  },
};

const PM_FROM_LOCKFILE: Record<string, SupportedPackageManager> = {
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm',
};

/**
 * Parses the `npm_config_user_agent` environment variable and returns its name and version.
 *
 * Code taken from {@link https://github.com/zkochan/packages/tree/main/which-pm-runs/ | which-pm-runs}.
 */
function pmFromUserAgent() {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) {
    return undefined;
  }
  const pmSpec = userAgent.split(' ', 1)[0];
  const separatorPos = pmSpec.lastIndexOf('/');
  const name = pmSpec.substring(0, separatorPos);
  return {
    name: name === 'npminstall' ? 'cnpm' : name,
    version: pmSpec.substring(separatorPos + 1),
  };
}

/**
 * Resolves the package manager to use. In order, it checks the following:
 *
 * 1. The value of the `NODE_INSTALLER` environment variable.
 * 2. The `process.env.npm_config_user_agent` value set by the executing package manager.
 * 3. The presence of a lockfile in an ancestor directory.
 * 4. If an unknown package manager is used (or none of the above apply), then we fall back to `npm`.
 *
 * The version of the executing package manager is also returned if it is detected via user agent.
 *
 * Supported package managers are `yarn`, `pnpm`, and `npm`.
 *
 */
export const resolvePackageManager: () => Promise<PMDetails> = async () => {
  const executingPM = pmFromUserAgent();
  let lockfilePM;
  const lockfile = await findUp(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'], { type: 'file' });
  if (lockfile) {
    const lockfileName = path.basename(lockfile);
    lockfilePM = PM_FROM_LOCKFILE[lockfileName];
  }
  const installer = process.env.NODE_INSTALLER || executingPM?.name || lockfilePM;

  // TODO(erickzhao): Remove NODE_INSTALLER environment variable for Forge 8
  if (typeof process.env.NODE_INSTALLER === 'string' && !hasWarned) {
    console.warn(logSymbols.warning, chalk.yellow(`The NODE_INSTALLER environment variable is deprecated and will be removed in Electron Forge v8`));
    hasWarned = true;
  }

  switch (installer) {
    case 'yarn':
    case 'npm':
    case 'pnpm':
      d(
        `Resolved package manager to ${installer}. (Derived from NODE_INSTALLER: ${process.env.NODE_INSTALLER}, npm_config_user_agent: ${process.env.npm_config_user_agent}, lockfile: ${lockfilePM})`
      );
      return { ...PACKAGE_MANAGERS[installer], version: executingPM?.version };
    default:
      if (installer !== undefined) {
        console.warn(
          logSymbols.warning,
          chalk.yellow(`Package manager ${chalk.red(installer)} is unsupported. Falling back to ${chalk.green('npm')} instead.`)
        );
      } else {
        d(`No package manager detected. Falling back to npm.`);
      }
      return PACKAGE_MANAGERS['npm'];
  }
};

export const spawnPackageManager = async (pm: PMDetails, args?: CrossSpawnArgs, opts?: CrossSpawnOptions): Promise<string> => {
  return (await spawn(pm.executable, args, opts)).trim();
};
