const url = require('url');
const fs = require('fs');

exports.dynamicImport = function dynamicImport(path) {
  try {
    return import(fs.existsSync(path) ? url.pathToFileURL(path) : path);
  } catch (error) {
    return Promise.reject(error);
  }
};

exports.dynamicImportMaybe = function dynamicImportMaybe(path) {
  return exports.dynamicImport(path).catch(() => require(path));
};
