import path from 'node:path';

import {
  calculateIntegrityDigestForApp,
  setStoredIntegrityDigestForApp,
  // eslint-disable-next-line import/no-unresolved -- @electron/asar is ESM; ESLint can't resolve it.
} from '@electron/asar';
import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
import {
  ForgeMultiHookMap,
  type ForgePlatform,
} from '@electron-forge/shared-types';

type IntegrityDigestVersion = 1; // TODO: Export this from @electron/asar

export type IntegrityDigestConfig = {
  version: IntegrityDigestVersion;
};

export default class IntegrityDigestPlugin extends PluginBase<IntegrityDigestConfig> {
  name = 'integrity-digest';

  constructor(config: IntegrityDigestConfig = { version: 1 }) {
    super(config);
  }

  getHooks(): ForgeMultiHookMap {
    return {
      packageAfterCopy: namedHookWithTaskFn<'packageAfterCopy'>(
        async (
          listrTask,
          resolvedForgeConfig,
          resourcesPath,
          electronVersion,
          platform,
        ) => {
          const { version } = this.config;
          const applePlatforms: ForgePlatform[] = ['darwin', 'mas'];
          if (!applePlatforms.includes(platform)) return;
          // `resourcesPath` points to `<App>.app/Contents/Resources/app`, so go up 3 levels to reach `<App>.app`.
          const appPath = path.resolve(resourcesPath, '../../..');
          const integrityDigest = calculateIntegrityDigestForApp(
            appPath,
            version,
          );
          setStoredIntegrityDigestForApp(appPath, integrityDigest);
        },
        'Calculating and Storing Integrity Digest',
      ),
    };
  }
}

export { IntegrityDigestPlugin };
