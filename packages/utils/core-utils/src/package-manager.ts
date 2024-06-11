import { CrossSpawnArgs, CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import chalk from 'chalk';
import { detect } from 'detect-package-manager';
import logSymbols from 'log-symbols';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export const getPackageManager = async (): Promise<PackageManager> => {
  // detect-package-manager results are cached
  const detectedPackageManager = await detect();
  const installer = process.env.NODE_INSTALLER || detectedPackageManager;
  if (!process.env.NODE_INSTALLER) {
    console.warn(logSymbols.warning, chalk.yellow(`Unknown NODE_INSTALLER env, using detected installer ${installer}`));
  }
  return installer as PackageManager;
};

export const packageManagerSpawn = async (args?: CrossSpawnArgs, opts?: CrossSpawnOptions): Promise<string> => {
  const pm = await getPackageManager();
  return spawn(pm, args, opts);
};

export const isNpm = async () => {
  return (await getPackageManager()) === 'npm';
};

export const isYarn = async () => {
  return (await getPackageManager()) === 'yarn';
};

export const isPnpm = async () => {
  return (await getPackageManager()) === 'pnpm';
};
