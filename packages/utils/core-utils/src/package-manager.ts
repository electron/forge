import { env } from 'node:process';

import { CrossSpawnArgs, CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import yarnOrNpm from 'yarn-or-npm';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export const getPackageManager = (): PackageManager => {
  const system = yarnOrNpm();
  console.log(env.NODE_INSTALLER, 'test env NODE_INSTALLER');

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
