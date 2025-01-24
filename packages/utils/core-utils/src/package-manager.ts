import { CrossSpawnArgs, CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import chalk from 'chalk';
import { detect } from 'detect-package-manager';
import logSymbols from 'log-symbols';

export const resolvePackageManager = async () => {
  const system = await detect();
  switch (process.env.NODE_INSTALLER) {
    case 'yarn':
    case 'npm':
      return process.env.NODE_INSTALLER;
    default:
      if (process.env.NODE_INSTALLER) {
        console.warn(logSymbols.warning, chalk.yellow(`Unknown NODE_INSTALLER, using detected installer ${system}`));
      }
      return system;
  }
};

export const spawnPackageManager = async (args?: CrossSpawnArgs, opts?: CrossSpawnOptions): Promise<string> => spawn(await resolvePackageManager(), args, opts);
