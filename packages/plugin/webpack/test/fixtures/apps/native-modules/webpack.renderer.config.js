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
    extensions: ['.js'],
    modules: ['node_modules', resolve(__dirname, 'src')],
  },
};
