import path from 'node:path';

import { PossibleModule } from '@electron-forge/shared-types';
import debug from 'debug';
import { pathToFileURL } from 'node:url';

const d = debug('electron-forge:import-search');

/**
 * @see https://github.com/nodejs/node/blob/4ea921bdbf94c11e86ef6b53aa7425c6df42876a/lib/internal/errors.js#L1611-L1617C1
 */
type ResolutionError = Error & {
  code: string;
};

/**
 * Dynamically `import()` the first resolvable module from a list of candidate paths.
 *
 * Resolution order for each entry in {@link paths}:
 *
 * 1. Local monorepo short-circuit: when running from a Forge checkout and the
 *    path is a single `@electron-forge/*` specifier, derives the package location
 *    within the monorepo and attempts a direct import (skips node_modules).
 * 2. The raw path as-is (relies on Node's own resolution).
 * 3. `path.resolve(relativeTo, path)` — resolved against the given directory.
 * 4. `path.resolve(relativeTo, 'node_modules', path)` — explicit node_modules lookup.
 *
 * Only `ERR_MODULE_NOT_FOUND` errors are swallowed; any other error is re-thrown.
 *
 * @returns The raw module namespace object of the first successful import, or `null` if no module is found.
 */
async function importSearchRaw<T>(
  relativeTo: string,
  paths: string[],
): Promise<T | null> {
  // Attempt to locally short-circuit if we're running from a checkout of forge
  if (
    import.meta.dirname.includes('forge/packages/api/core/') &&
    paths.length === 1 &&
    paths[0].startsWith('@electron-forge/')
  ) {
    const [moduleType, moduleName] = paths[0].split('/')[1].split('-');
    try {
      const localPath = path.resolve(
        import.meta.dirname,
        '..',
        '..',
        '..',
        '..',
        moduleType,
        moduleName,
      );
      d('testing local forge build', { moduleType, moduleName, localPath });
      return await import(pathToFileURL(localPath).toString());
    } catch {
      // Ignore
    }
  }

  // Load via normal search paths
  const testPaths = paths
    .concat(paths.map((mapPath) => path.resolve(relativeTo, mapPath)))
    .concat(
      paths.map((mapPath) => path.resolve(relativeTo, 'node_modules', mapPath)),
    );
  d('searching', testPaths, 'relative to', relativeTo);
  for (const testPath of testPaths) {
    try {
      d('testing', testPath);
      return await import(testPath);
    } catch (err) {
      if (err instanceof Error) {
        const resolutionError = err as ResolutionError;
        if (resolutionError.code !== 'ERR_MODULE_NOT_FOUND') {
          throw err;
        }
      }
    }
  }
  d('failed to find a module in', testPaths);
  return null;
}

/**
 * Used throughout `@electron-forge` to dynamically load makers, publishers,
 * plugins, and lifecycle hooks by package name. Only accepts default exports.
 *
 * @param relativeTo - Directory to resolve relative paths against (typically the project root).
 * @param paths - Module specifiers to attempt (e.g. `['@electron-forge/maker-zip']`).
 * @returns The module's default export, or `null` if the module was not found
 *          or has no default export.
 */
export async function importSearch<T>(
  relativeTo: string,
  paths: string[],
): Promise<T | null> {
  const result = await importSearchRaw<PossibleModule<T>>(relativeTo, paths);
  return typeof result === 'object' && result && result.default
    ? result.default
    : null;
}
