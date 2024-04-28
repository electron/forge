const url = require('url');

exports.dynamicImport = function dynamicImport(path) {
  try {
    return import(url.pathToFileURL(path));
  } catch (error) {
    return Promise.reject(error);
  }
};

exports.dynamicImportMaybe = function dynamicImportMaybe(path) {
  return exports.dynamicImport(path).catch(() => require(path));
};
