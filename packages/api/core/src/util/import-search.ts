import path from 'node:path';

import debug from 'debug';

const d = debug('electron-forge:import-search');

/**
 * @see https://github.com/nodejs/node/blob/4ea921bdbf94c11e86ef6b53aa7425c6df42876a/lib/internal/errors.js#L1611-L1617C1
 */
type ResolutionError = Error & {
  code: string;
};

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
      return await import(localPath);
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

export type PossibleModule<T> = {
  default?: T;
} & T;

export default async <T>(
  relativeTo: string,
  paths: string[],
): Promise<T | null> => {
  const result = await importSearchRaw<PossibleModule<T>>(relativeTo, paths);
  return typeof result === 'object' && result && result.default
    ? result.default
    : (result as T | null);
};
