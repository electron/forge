import { rules } from './webpack.rules';

export const mainConfig = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.js',
  module: {
    rules,
  },
};
