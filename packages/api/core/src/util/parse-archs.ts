import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';
import { allOfficialArchsForPlatformAndVersion } from '@electron/packager';

export default function parseArchs(platform: ForgePlatform | string, declaredArch: ForgeArch | 'all' | string, electronVersion: string): ForgeArch[] {
  if (declaredArch === 'all') {
    return allOfficialArchsForPlatformAndVersion(platform, electronVersion) || ['x64'];
  }

  return declaredArch.split(',') as ForgeArch[];
}
