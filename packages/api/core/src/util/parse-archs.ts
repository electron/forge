import { allOfficialArchsForPlatformAndVersion, SupportedPlatform } from '@electron/packager';
import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';

export default function parseArchs(platform: ForgePlatform | string, declaredArch: ForgeArch | 'all' | string, electronVersion: string): ForgeArch[] {
  if (declaredArch === 'all') {
    return allOfficialArchsForPlatformAndVersion(platform as SupportedPlatform, electronVersion) || ['x64'];
  }

  return declaredArch.split(',') as ForgeArch[];
}
