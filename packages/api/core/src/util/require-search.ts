import debug from 'debug';
import path from 'path';

const d = debug('electron-forge:require-search');

// https://github.com/nodejs/node/blob/da0ede1ad55a502a25b4139f58aab3fb1ee3bf3f/lib/internal/modules/cjs/loader.js#L353-L359
type RequireError = Error & {
  code: string;
  path: string;
  requestPath: string | undefined;
};

export function requireSearchRaw<T>(relativeTo: string, paths: string[]): T | null {
  const testPaths = paths
    .concat(paths.map((mapPath) => path.resolve(relativeTo, mapPath)))
    .concat(paths.map((mapPath) => path.resolve(relativeTo, 'node_modules', mapPath)));
  d('searching', testPaths, 'relative to', relativeTo);
  for (const testPath of testPaths) {
    try {
      d('testing', testPath);
      // eslint-disable-next-line global-require, import/no-dynamic-require
      return require(testPath);
    } catch (err) {
      if (err instanceof Error) {
        const requireErr = err as RequireError;
        // Ignore require-related errors
        if (requireErr.code !== 'MODULE_NOT_FOUND' || ![undefined, testPath].includes(requireErr.requestPath)) {
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

// eslint-disable-next-line arrow-parens
export default <T>(relativeTo: string, paths: string[]): T | null => {
  const result = requireSearchRaw<PossibleModule<T>>(relativeTo, paths);
  return typeof result === 'object' && result && result.default ? result.default : (result as T | null);
};
