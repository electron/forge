import { PluginBase } from '@electron-forge/plugin-base';
import { ForgeHookFn, ForgeHookMap } from '@electron-forge/shared-types';

import { AutoUnpackNativesConfig } from './Config';

export default class AutoUnpackNativesPlugin extends PluginBase<AutoUnpackNativesConfig> {
  name = 'auto-unpack-natives';

  getHooks(): ForgeHookMap {
    return {
      resolveForgeConfig: this.resolveForgeConfig,
    };
  }

  resolveForgeConfig: ForgeHookFn<'resolveForgeConfig'> = async (forgeConfig) => {
    if (!forgeConfig.packagerConfig) {
      forgeConfig.packagerConfig = {};
    }
    if (!forgeConfig.packagerConfig.asar) {
      throw new Error('The AutoUnpackNatives plugin requires asar to be truthy or an object');
    }
    if (forgeConfig.packagerConfig.asar === true) {
      forgeConfig.packagerConfig.asar = {};
    }
    const existingUnpack = forgeConfig.packagerConfig.asar.unpack;
    const newUnpack = '**/*.node';
    if (existingUnpack) {
      forgeConfig.packagerConfig.asar.unpack = `{${existingUnpack},${newUnpack}}`;
    } else {
      forgeConfig.packagerConfig.asar.unpack = newUnpack;
    }
    return forgeConfig;
  };
}

export { AutoUnpackNativesPlugin, AutoUnpackNativesConfig };
