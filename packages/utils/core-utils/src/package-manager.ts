import path from 'node:path';

import {
  CrossSpawnArgs,
  CrossSpawnOptions,
  spawn,
} from '@malept/cross-spawn-promise';
import debug from 'debug';
import semver from 'semver';

import { findUp } from './find-up.js';

const d = debug('electron-forge:package-manager');

export type SupportedPackageManager = 'yarn' | 'npm' | 'pnpm';
export type PMDetails = {
  executable: SupportedPackageManager;
  version?: string;
  install: string;
  dev: string;
  exact: string;
};

let explicitPMCache: PMDetails | undefined;

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

const LEAKED_NPM_CONFIG_ENV = new Set([
  'npm_config_allow_scripts',
  'npm_config_strict_allow_scripts',
  'npm_config_dangerously_allow_all_scripts',
]);

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
 * Whether a resolved Yarn version is Yarn 2+ (Berry). An explicitly requested
 * package manager can carry a partial version (e.g. `yarn@1`), which
 * `semver.gte` rejects, so the version is coerced first. A version that can't
 * be parsed is not Berry.
 */
export function isYarnBerry(version: string | undefined): boolean {
  if (version === 'latest') {
    return true;
  }
  const yarnVersion = semver.coerce(version);
  return yarnVersion !== null && semver.gte(yarnVersion, '2.0.0');
}

export interface ResolvePackageManagerOptions {
  /**
   * The directory to start the lockfile search from. Defaults to the current
   * working directory. Pass the project directory when the command can be run
   * against a project other than the one in `process.cwd()`.
   */
  cwd?: string;
  /**
   * Prefer a lockfile found from `cwd` over the package manager that is
   * running the current command (`npm_config_user_agent`). Useful for commands
   * that act on an existing project, where `npx` always reports npm.
   */
  preferLockfile?: boolean;
}

/**
 * Resolves the package manager to use. In order, it checks the following:
 *
 * 1. An explicit arg being passed into the function.
 * 2. The `process.env.npm_config_user_agent` value set by the executing package manager.
 * 3. The presence of a lockfile in `options.cwd` (default: the current working directory) or an ancestor directory.
 *    With `options.preferLockfile`, this check runs before the user agent check.
 * 4. If an unknown package manager is used (or none of the above apply), then we fall back to `npm`.
 *
 * The version of the executing package manager is also returned if it is detected via user agent.
 *
 * Supported package managers are `yarn`, `pnpm`, and `npm`.
 *
 */
export const resolvePackageManager: (
  packageManager?: string,
  options?: ResolvePackageManagerOptions,
) => Promise<PMDetails> = async (packageManager, options = {}) => {
  let installer: string | undefined;
  let installerVersion: string | undefined;

  // Check explicit packageManager argument FIRST, before cache
  // This ensures explicit args always take precedence
  if (packageManager) {
    const match = packageManager.match(
      /^(npm|pnpm|yarn)(?:@(latest|\d+(?:\.\d+)?(?:\.\d+)?(?:-.+)?))?$/,
    );

    if (match) {
      const [, executable, version] = match;
      if (Object.keys(PACKAGE_MANAGERS).includes(executable)) {
        const pm = PACKAGE_MANAGERS[executable as SupportedPackageManager];
        installerVersion = version ?? 'latest';
        explicitPMCache = { ...pm, version: installerVersion };
        d(`Resolved and cached explicit package manager: ${pm.executable}`);
        return explicitPMCache;
      } else {
        d(
          `Attempted to parse ${packageManager} to regex but failed. Falling back!`,
        );
      }
    }
  }

  if (explicitPMCache) {
    d(`Using cached explicit package manager: ${explicitPMCache.executable}`);
    return explicitPMCache;
  }

  const executingPM = pmFromUserAgent();
  let lockfilePM;
  const lockfile = await findUp(
    ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'],
    { cwd: options.cwd },
  );
  if (lockfile) {
    const lockfileName = path.basename(lockfile);
    lockfilePM = PM_FROM_LOCKFILE[lockfileName];
  }

  if (executingPM && !(options.preferLockfile && lockfilePM)) {
    installer = executingPM.name;
    installerVersion = executingPM.version;
  } else if (lockfilePM) {
    installer = lockfilePM;
    // Run in the project directory so a Corepack shim picks up that
    // project's `packageManager` field rather than the current directory's.
    installerVersion = await spawnPackageManager(
      PACKAGE_MANAGERS[installer as SupportedPackageManager],
      ['--version'],
      { cwd: options.cwd },
    );
  }

  switch (installer) {
    case 'yarn':
    case 'npm':
    case 'pnpm':
      d(
        `Resolved package manager to ${installer}. (Derived from npm_config_user_agent: ${process.env.npm_config_user_agent}, lockfile: ${lockfilePM})`,
      );
      return {
        ...PACKAGE_MANAGERS[installer],
        version: installerVersion,
      };
    default:
      d(`No valid package manager detected. Falling back to npm.`);
      return {
        ...PACKAGE_MANAGERS['npm'],
        version: await spawnPackageManager(PACKAGE_MANAGERS['npm'], [
          '--version',
        ]),
      };
  }
};

export const spawnPackageManager = async (
  pm: PMDetails,
  args?: CrossSpawnArgs,
  opts?: CrossSpawnOptions,
): Promise<string> => {
  // Some npm versions (e.g. 11.19) leak user-level install-script policy config
  // into child processes as `npm_config_*` env vars, which nested project
  // installs then reject with EALLOWSCRIPTS.
  // @see https://github.com/electron/forge/issues/4420
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) =>
        !LEAKED_NPM_CONFIG_ENV.has(key.toLowerCase().replace(/-/g, '_')),
    ),
  );
  return (
    await spawn(pm.executable, args, {
      ...opts,
      env: { ...env, ...opts?.env },
    })
  ).trim();
};
