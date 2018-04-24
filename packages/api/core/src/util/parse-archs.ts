import { ForgePlatform, ForgeArch } from '@electron-forge/shared-types';

const { allOfficialArchsForPlatformAndVersion } = require('electron-packager/targets');

export default function parseArchs(
  platform: ForgePlatform | string,
  declaredArch: ForgeArch | 'all' | string,
  electronVersion: string
): ForgeArch[] {
  if (declaredArch === 'all') {
    return allOfficialArchsForPlatformAndVersion(platform, electronVersion) || ['x64'];
  }

  return declaredArch.split(',') as ForgeArch[];
}
