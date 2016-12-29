import path from 'path';

export default (relativeTo, paths) => {
  let result;
  for (const testPath of paths.concat(paths.map(mapPath => path.resolve(relativeTo, mapPath)))) {
    try {
      result = require(testPath);
      return typeof result === 'object' && result && result.default ? result.default : result;
    } catch (err) {
      // Ignore the error
    }
  }
};
