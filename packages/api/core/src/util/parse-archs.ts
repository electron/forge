import {
  allOfficialArchsForPlatformAndVersion,
  SupportedPlatform,
} from '@electron/packager';
import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';

import {
  assertSupportedArch,
  filterSupportedArchs,
} from './supported-archs.js';

export default function parseArchs(
  platform: ForgePlatform | string,
  declaredArch: ForgeArch | 'all' | string,
  electronVersion: string,
): ForgeArch[] {
  if (declaredArch === 'all') {
    const archs = allOfficialArchsForPlatformAndVersion(
      platform as SupportedPlatform,
      electronVersion,
    ) || ['x64'];
    // @electron/packager < 20.3.0 still reported architectures that
    // Electron >= 44 no longer publishes, so filter those out ourselves
    // rather than failing on a download 404.
    return filterSupportedArchs(platform, archs, electronVersion);
  }

  const archs = declaredArch.split(',') as ForgeArch[];
  for (const arch of archs) {
    assertSupportedArch(platform, arch, electronVersion);
  }

  return archs;
}
