import path from 'path';

import { ForgePlatform } from '@electron-forge/shared-types';

type GetElectronExecutablePathParams = {
  appName: string;
  basePath: string;
  platform: ForgePlatform;
};

export function getElectronExecutablePath({ appName, basePath, platform }: GetElectronExecutablePathParams): string {
  if (['darwin', 'mas'].includes(platform)) {
    return path.join(basePath, 'MacOS', appName);
  }

  const suffix = platform === 'win32' ? '.exe' : '';
  return path.join(basePath, `${appName}${suffix}`);
}
