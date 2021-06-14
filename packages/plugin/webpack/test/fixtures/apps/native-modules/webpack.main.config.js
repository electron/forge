const { resolve } = require('path');

module.exports = {
  entry: './src/index.js',
  performance: {
    hints: false,
  },
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: ['node_modules', resolve(__dirname, 'src')],
  },
};
