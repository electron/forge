const rules = require('./webpack.rules');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader/url' }, { loader: 'file-loader' }],
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
};
