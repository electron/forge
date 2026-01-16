import type { ForgeConfig } from '@electron-forge/shared-types';

export default async function (): Promise<ForgeConfig> {
  return {
    buildIdentifier: 'async-typescript-esm',
    rebuildConfig: {},
    makers: [
      {
        name: '@electron-forge/maker-zip',
        platforms: ['darwin'],
        config: {},
      },
    ],
  };
}
