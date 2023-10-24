import { CrossSpawnArgs, CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import chalk from 'chalk';
import { detect } from 'detect-package-manager';
import logSymbols from 'log-symbols';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export const getPackageManager = async (): Promise<PackageManager> => {
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

const cacheWrap = (fn: () => Promise<PackageManager>) => {
  const cache = new Map();
  return async (key: string): Promise<boolean> => {
    if (cache.has(key)) {
      return cache.get(key);
    }
    const pm = await fn();
    cache.set(key, pm === key);
    return pm === key;
  };
};

const _pm = cacheWrap(getPackageManager);

export const isNpm = async () => {
  return await _pm('npm');
};

export const isYarn = async () => {
  return await _pm('yarn');
};

export const isPnpm = async () => {
  return await _pm('pnpm');
};
