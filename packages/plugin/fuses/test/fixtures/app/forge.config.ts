import path from 'path';

import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { ForgeConfig } from '@electron-forge/shared-types';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line import/no-unresolved,node/no-missing-import
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import fsExtra from 'fs-extra';

const forgeConfig: ForgeConfig = {
  packagerConfig: {
    afterComplete: [
      // makes tests a bit simpler by having a single output directory in every platform/arch
      async (packagedAppLocation, _electronVersion, _targetPlatform, _targetArch, done) => {
        const parentDir = path.resolve(packagedAppLocation, '..');
        await fsExtra.move(packagedAppLocation, path.join(parentDir, 'fuses-test-app'), {
          overwrite: true,
        });

        done();
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
