import path from 'path';

import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
import { ForgeMultiHookMap, ForgePlatform } from '@electron-forge/shared-types';
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

        const applePlatforms: ForgePlatform[] = ['darwin', 'mas'];

        if (Object.keys(fusesConfig).length) {
          const pathToElectronExecutable = getElectronExecutablePath({
            appName: applePlatforms.includes(platform) ? 'Electron' : 'electron',
            basePath: path.resolve(resourcesPath, '../..'),
            platform,
          });

          const osxSignConfig = resolvedForgeConfig.packagerConfig.osxSign;
          const hasOSXSignConfig = (typeof osxSignConfig === 'object' && Boolean(Object.keys(osxSignConfig).length)) || Boolean(osxSignConfig);

          await flipFuses(pathToElectronExecutable, {
            resetAdHocDarwinSignature: !hasOSXSignConfig && applePlatforms.includes(platform) && arch === 'arm64',
            ...this.fusesConfig,
          });
        }
      }, 'Flipping Fuses'),
    };
  }
}

export { FusesPlugin };
