import { CrossSpawnArgs, CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export const getPackageManager = (): PackageManager => {
  const userAgent = process.env.npm_config_user_agent || '';

  if (userAgent.startsWith('yarn')) {
    return 'yarn';
  }

  if (userAgent.startsWith('pnpm')) {
    return 'pnpm';
  }

  return 'npm';
};

export const packageManagerSpawn = (args?: CrossSpawnArgs, opts?: CrossSpawnOptions): Promise<string> => spawn(getPackageManager(), args, opts);

export const isNpm = (): boolean => getPackageManager() === 'npm';

export const isYarn = (): boolean => getPackageManager() === 'yarn';

export const isPnpm = (): boolean => getPackageManager() === 'pnpm';
