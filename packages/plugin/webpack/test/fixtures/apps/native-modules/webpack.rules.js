const path = require('path');

// platform-aware path separator for loader test regex
const sep = '\\' + path.sep;

module.exports = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: new RegExp(`native_modules${sep}.+\\.node$`),
    use: 'node-loader',
  },
  {
    test: new RegExp(`${sep}node_modules${sep}.+\\.(m?js|node)$`),
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
];
