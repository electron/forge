import path from 'path';

import { ForgePlatform } from '@electron-forge/shared-types';

type GetElectronExecutablePathParams = {
  appName: string;
  basePath: string;
  platform: ForgePlatform;
};

export function getElectronExecutablePath({ appName, basePath, platform }: GetElectronExecutablePathParams): string {
  return path.join(
    basePath,
    ['darwin', 'mas'].includes(platform) ? path.join('MacOS', appName) : [appName, process.platform === 'win32' ? '.exe' : ''].join('')
  );
}
