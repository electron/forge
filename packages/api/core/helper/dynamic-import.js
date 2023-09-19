const url = require('url');

exports.dynamicImport = function dynamicImport(path) {
  return import(url.pathToFileURL(path));
};
