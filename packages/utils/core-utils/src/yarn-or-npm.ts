import { CrossSpawnArgs, CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import chalk from 'chalk';
import { detect } from 'detect-package-manager';
import logSymbols from 'log-symbols';

export const safeYarnOrNpm = async () => {
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

export const yarnOrNpmSpawn = async (args?: CrossSpawnArgs, opts?: CrossSpawnOptions): Promise<string> => spawn(await safeYarnOrNpm(), args, opts);

export const hasYarn = async () => (await safeYarnOrNpm()) === 'yarn';
