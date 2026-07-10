// Regression fixture for https://github.com/electron/forge/issues/3949: a
// named import from a CJS package (webpack) whose class statics are assigned
// after the class definition. The loaded values must be the exact same
// instances the loading process sees — a config loader that evaluates
// dependencies in a parallel module system hands out a duplicate webpack.
import { Compilation } from 'webpack';

import type { ForgeConfig } from '@electron-forge/shared-types';

const config: ForgeConfig & {
  stage: number;
  compilationClass: typeof Compilation;
} = {
  buildIdentifier: 'webpack-dep',
  stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER,
  compilationClass: Compilation,
};

export default config;
