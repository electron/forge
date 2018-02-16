import debug from 'debug';
import path from 'path';

const d = debug('electron-forge:require-search');

export function requireSearchRaw(relativeTo, paths) {
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
}

export default (relativeTo, paths) => {
  const result = requireSearchRaw(relativeTo, paths);
  return typeof result === 'object' && result && result.default ? result.default : result;
};
