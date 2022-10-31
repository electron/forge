import { CrossSpawnArgs, CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import yarnOrNpm from 'yarn-or-npm';

export const safeYarnOrNpm = () => {
  const system = yarnOrNpm();
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

export const yarnOrNpmSpawn = (args?: CrossSpawnArgs, opts?: CrossSpawnOptions): Promise<string> => spawn(safeYarnOrNpm(), args, opts);

export const hasYarn = (): boolean => safeYarnOrNpm() === 'yarn';
