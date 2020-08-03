import debug from 'debug';
import path from 'path';

const d = debug('electron-forge:require-search');

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
      // Ignore require-related errors
      if (err.code !== 'MODULE_NOT_FOUND' || ![undefined, testPath].includes(err.requestPath)) {
        throw err;
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
  return typeof result === 'object' && result && result.default ? result.default : result as (T | null);
};
