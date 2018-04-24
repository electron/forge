import debug from 'debug';
import path from 'path';

const d = debug('electron-forge:require-search');

export function requireSearchRaw<T>(relativeTo: string, paths: string[]): T | null {
  const testPaths = paths
    .concat(paths.map(mapPath => path.resolve(relativeTo, mapPath)))
    .concat(paths.map(mapPath => path.resolve(relativeTo, 'node_modules', mapPath)));
  d('searching', testPaths, 'relative to', relativeTo);
  for (const testPath of testPaths) {
    try {
      d('testing', testPath);
      return require(testPath);
    } catch (err) {
      // Ignore the error
    }
  }
  d('failed to find a module in', testPaths);
  return null;
}

export type PossibleModule<T> = {
  default?: T;
} & T;

export default <T>(relativeTo: string, paths: string[]): T | null => {
  const result = requireSearchRaw<PossibleModule<T>>(relativeTo, paths);
  return typeof result === 'object' && result && result.default ? result.default : result as (T | null);
};
