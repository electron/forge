module.exports = {
  context: import.meta.dirname,
  entry: './src/index.js',
  performance: {
    hints: false,
  },
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js'],
  },
};
