const url = require('url');
const fs = require('fs');

exports.dynamicImport = function dynamicImport(path) {
  try {
    return import(fs.existsSync(path) ? url.pathToFileURL(path) : path);
  } catch (error) {
    return Promise.reject(error);
  }
};

exports.dynamicImportMaybe = async function dynamicImportMaybe(path) {
  try {
    return require(path);
  } catch (e1) {
    try {
      return await exports.dynamicImport(path);
    } catch {
      throw e1;
    }
  }
};
