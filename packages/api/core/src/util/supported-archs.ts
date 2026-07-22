import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';
import semver from 'semver';

/**
 * The first Electron release that no longer publishes prebuilt binaries for
 * these platform/arch combinations. Electron 44.0.0-alpha.1 through alpha.3
 * still shipped them, and Electron 43 and earlier continue to publish them
 * until end-of-support in January 2027.
 */
const FIRST_RELEASE_WITHOUT_DROPPED_ARCHS = '44.0.0-alpha.4';

const DROPPED_ARCHS: ReadonlyArray<{
  platform: ForgePlatform;
  arch: ForgeArch;
  label: string;
}> = [
  { platform: 'win32', arch: 'ia32', label: 'Windows ia32' },
  { platform: 'linux', arch: 'armv7l', label: 'Linux armv7l' },
];

/**
 * Whether Electron stopped publishing prebuilt binaries for the given
 * platform/arch combination as of the given Electron version.
 *
 * Electron 44.0.0-alpha.4 and later no longer publish win32/ia32 or
 * linux/armv7l builds, but `allOfficialArchsForPlatformAndVersion()` from
 * `@electron/packager` (as of 18.x) still reports them, which would otherwise
 * surface as an opaque download 404.
 */
export function isDroppedArch(
  platform: ForgePlatform | string,
  arch: ForgeArch | string,
  electronVersion: string,
): boolean {
  if (
    !DROPPED_ARCHS.some(
      (dropped) => dropped.platform === platform && dropped.arch === arch,
    )
  ) {
    return false;
  }

  // If we can't parse the version, don't second-guess it here — let the
  // usual version handling produce its own error.
  if (!semver.valid(electronVersion)) {
    return false;
  }

  return semver.gte(electronVersion, FIRST_RELEASE_WITHOUT_DROPPED_ARCHS);
}

function droppedArchError(
  platform: ForgePlatform | string,
  arch: ForgeArch | string,
  electronVersion: string,
): Error {
  return new Error(
    `Cannot build for ${platform}/${arch}: Electron >= 44 no longer publishes Windows ia32 / Linux armv7l builds ` +
      `(requested Electron version: ${electronVersion}). Use Electron <= 43 (supported until Jan 2027) to target ${platform}/${arch}.`,
  );
}

/**
 * Throws a descriptive error when the user explicitly requests an
 * architecture that the given Electron version no longer publishes.
 */
export function assertSupportedArch(
  platform: ForgePlatform | string,
  arch: ForgeArch | string,
  electronVersion: string,
): void {
  if (isDroppedArch(platform, arch, electronVersion)) {
    throw droppedArchError(platform, arch, electronVersion);
  }
}

/**
 * Filters architectures that the given Electron version no longer publishes
 * out of an `--arch=all` expansion, warning about each one that is skipped.
 */
export function filterSupportedArchs(
  platform: ForgePlatform | string,
  archs: ForgeArch[],
  electronVersion: string,
): ForgeArch[] {
  return archs.filter((arch) => {
    if (isDroppedArch(platform, arch, electronVersion)) {
      console.warn(
        `Skipping ${platform}/${arch}: Electron >= 44 no longer publishes prebuilt binaries for this architecture. ` +
          `Use Electron <= 43 (supported until Jan 2027) to target it.`,
      );
      return false;
    }
    return true;
  });
}
