import semver from 'semver';

/**
 * Checks for support for the {@link https://nodejs.org/api/module.html#moduleregisterspecifier-parenturl-options | module.register} API
 * in Node.js, powers `tsx`'s `register` APIs (used to load TypeScript Forge configurations).
 *
 * This API was added in Node.js v18.19.0 and v20.6.0.
 *
 * @deprecated Remove in Electron Forge 8 when Node 22 is the minimum version.
 */
export function supportsModuleRegister(version: string) {
  const parsed = semver.parse(version);
  if (parsed === null) {
    return false;
  }

  if (parsed.major < 18) {
    return false;
  } else if (parsed.major === 18) {
    return parsed.minor >= 19;
  } else if (parsed.major === 19) {
    return false;
  } else if (parsed.major === 20) {
    return parsed.minor >= 6;
  } else {
    return true;
  }
}
