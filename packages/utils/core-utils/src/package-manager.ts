import { CrossSpawnArgs, CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import chalk from 'chalk';
import { detect } from 'detect-package-manager';
import logSymbols from 'log-symbols';

export type SupportedPackageManager = 'yarn' | 'npm' | 'pnpm';
export type PMDetails = { executable: SupportedPackageManager; install: string; dev: string; exact: string };

const MANAGERS: Record<SupportedPackageManager, PMDetails> = {
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

/**
 * Resolves the package manager to use. Prioritizes the `NODE_INSTALLER` environment variable.
 * Supported package managers are `yarn`, `pnpm`, and `npm`.
 *
 * If an unknown package manager is used, then a warning is logged and we fall back to `npm`.
 */
export const resolvePackageManager: () => Promise<PMDetails> = async () => {
  const system = await detect();
  const installer = process.env.NODE_INSTALLER || system;

  switch (installer) {
    case 'yarn':
    case 'npm':
    case 'pnpm':
      return MANAGERS[installer];
    default:
      console.warn(logSymbols.warning, chalk.yellow(`Package manager ${chalk.red(installer)} is unsupported. Falling back to ${chalk.green('npm')} instead.`));
      return MANAGERS['npm'];
  }
};

export const spawnPackageManager = async (args?: CrossSpawnArgs, opts?: CrossSpawnOptions): Promise<string> =>
  spawn((await resolvePackageManager()).executable, args, opts);
