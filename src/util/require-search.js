import debug from 'debug';
import path from 'path';

const d = debug('electron-forge:require-search');

export default (relativeTo, paths) => {
  const testPaths = paths
    .concat(paths.map(mapPath => path.resolve(relativeTo, mapPath)))
    .concat(paths.map(mapPath => path.resolve(relativeTo, 'node_modules', mapPath)));
  d('searching', testPaths, 'relative to', relativeTo);
  let result;
  for (const testPath of testPaths) {
    try {
      d('testing', testPath);
      result = require(testPath);
      return typeof result === 'object' && result && result.default ? result.default : result;
    } catch (err) {
      // Ignore the error
    }
  }
  d('failed to find a module in', testPaths);
};
