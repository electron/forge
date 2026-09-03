import { rules } from './webpack.rules.mjs';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

export default {
  module: {
    rules,
  },
};
