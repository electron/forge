import { CrossSpawnArgs, CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import yarnOrNpm from 'yarn-or-npm';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export const getPackageManager = (): PackageManager => {
  const userAgent = process.env.npm_config_user_agent || '';
  const system = yarnOrNpm();

  if (userAgent.startsWith('yarn')) {
    return 'yarn';
  }

  if (userAgent.startsWith('npm')) {
    return 'npm';
  }

  if (userAgent.startsWith('pnpm')) {
    return 'pnpm';
  }

  // use NODE_INSTALLER as an override of npm_config_user_agent
  switch (process.env.NODE_INSTALLER) {
    case 'yarn':
    case 'npm':
    case 'pnpm':
      return process.env.NODE_INSTALLER;
    default:
      if (process.env.NODE_INSTALLER) {
        console.warn(logSymbols.warning, chalk.yellow(`Unknown NODE_INSTALLER, using detected installer ${system}`));
      }
      return system;
  }
};

export const packageManagerSpawn = (args?: CrossSpawnArgs, opts?: CrossSpawnOptions): Promise<string> => spawn(getPackageManager(), args, opts);

export const isNpm = (): boolean => getPackageManager() === 'npm';

export const isYarn = (): boolean => getPackageManager() === 'yarn';

export const isPnpm = (): boolean => getPackageManager() === 'pnpm';
