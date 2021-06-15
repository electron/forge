module.exports = {
  context: __dirname,
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
