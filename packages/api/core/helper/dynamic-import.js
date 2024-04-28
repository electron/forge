const url = require('url');

exports.dynamicImport = function dynamicImport(path) {
  try {
    return import(url.pathToFileURL(path));
  } catch (error) {
    return Promise.reject(error);
  }
};
