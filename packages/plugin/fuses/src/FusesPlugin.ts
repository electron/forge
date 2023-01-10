import path from 'path';

import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
import { ForgeMultiHookMap } from '@electron-forge/shared-types';
// Why: users are expected to have this package installed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line import/no-unresolved,node/no-missing-import
import { flipFuses, FuseConfig } from '@electron/fuses';

import { getElectronExecutablePath } from './util/getElectronExecutablePath';

export default class FusesPlugin extends PluginBase<FuseConfig> {
  name = 'fuses';

  fusesConfig = {} as FuseConfig;

  constructor(fusesConfig: FuseConfig) {
    super(fusesConfig);

    this.fusesConfig = fusesConfig;
  }

  getHooks(): ForgeMultiHookMap {
    return {
      packageAfterCopy: namedHookWithTaskFn<'packageAfterCopy'>(async (listrTask, resolvedForgeConfig, resourcesPath, electronVersion, platform, arch) => {
        const { fusesConfig } = this;

        if (Object.keys(fusesConfig).length) {
          const pathToElectronExecutable = getElectronExecutablePath({
            appName: ['darwin', 'mas'].includes(platform) ? 'Electron' : 'electron',
            basePath: path.resolve(resourcesPath, '../..'),
            platform,
          });

          const osxSignConfig = resolvedForgeConfig.packagerConfig.osxSign;
          const hasOSXSignConfig = (typeof osxSignConfig === 'object' && Boolean(Object.keys(osxSignConfig).length)) || Boolean(osxSignConfig);

          await flipFuses(pathToElectronExecutable, {
            resetAdHocDarwinSignature: !hasOSXSignConfig && platform === 'darwin' && arch === 'arm64',
            ...this.fusesConfig,
          });
        }
      }, 'Flipping Fuses'),
    };
  }
}

export { FusesPlugin };
