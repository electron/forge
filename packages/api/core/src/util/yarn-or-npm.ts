import chalk from 'chalk';
import { CrossSpawnArgs, CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import logSymbols from 'log-symbols';
import yarnOrNpm from 'yarn-or-npm';

const safeYarnOrNpm = (): string => {
  const system = yarnOrNpm();
  switch (process.env.NODE_INSTALLER) {
    case 'yarn':
    case 'npm':
      return process.env.NODE_INSTALLER;
    default:
      if (process.env.NODE_INSTALLER) {
        // eslint-disable-next-line no-console
        console.warn(logSymbols.warning, chalk.yellow(`Unknown NODE_INSTALLER, using detected installer ${system}`));
      }
      return system;
  }
};

export default safeYarnOrNpm;

// eslint-disable-next-line max-len
export const yarnOrNpmSpawn = (args?: CrossSpawnArgs, opts?: CrossSpawnOptions): Promise<string> => spawn(safeYarnOrNpm(), args, opts);

export const hasYarn = (): boolean => safeYarnOrNpm() === 'yarn';
