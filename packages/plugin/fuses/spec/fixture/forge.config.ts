import fs from 'fs/promises';
import path from 'path';

import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { ForgeConfig } from '../../../../utils/types/src/index';
import { FusesPlugin } from '../../src/FusesPlugin';

const forgeConfig: ForgeConfig = {
  packagerConfig: {
    afterComplete: [
      // makes tests a bit simpler by having a single output directory in every platform/arch
      async ({ buildPath }) => {
        const parentDir = path.resolve(buildPath, '..');
        const dest = path.join(parentDir, 'fuses-test-app');
        await fs.rm(dest, { recursive: true, force: true });
        await fs.rename(buildPath, dest);
      },
    ],
  },

  plugins: [
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
    }),
  ],
};

export default forgeConfig;
