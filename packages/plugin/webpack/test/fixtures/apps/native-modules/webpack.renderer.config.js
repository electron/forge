const { resolve } = require('path');
const rules = require('./webpack.rules');

module.exports = {
  performance: {
    hints: false,
  },
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    modules: ['node_modules', resolve(__dirname, 'src')],
  },
};
