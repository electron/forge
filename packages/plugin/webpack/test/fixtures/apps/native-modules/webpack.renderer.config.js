const rules = require('./webpack.rules');

module.exports = {
  context: __dirname,
  target: 'electron-renderer',
  performance: {
    hints: false,
  },
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js'],
  },
};
