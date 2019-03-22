const path = require('path');

module.exports = {
  dependencies: ['react'],
  devDependencies: ['react-dom'],
  templateDirectory: path.resolve(__dirname, './tmpl'),
  postCopy: (initDir, ora, lintStyle) => {},
};
