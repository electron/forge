import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import { detectNativePackages } from '../detect-native-modules.js';
import {
  external,
  getBuildConfig,
  getBuildDefine,
  pluginHotRestart,
} from './vite.base.config.js';

export function getConfig(
  forgeEnv: ConfigEnv<'build'>,
  userConfig: UserConfig = {},
): UserConfig {
  const { forgeConfigSelf } = forgeEnv;
  const nativePackages = detectNativePackages(forgeEnv.root);
  const define = getBuildDefine(forgeEnv);
  const config: UserConfig = {
    build: {
      copyPublicDir: false,
      rollupOptions: {
        external: [...external, 'electron/main', ...nativePackages],
      },
    },
    plugins: [pluginHotRestart('restart')],
    define,
    resolve: {
      // Load the Node.js entry.
      conditions: ['node'],
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
  };
  const buildConfig = getBuildConfig(forgeEnv);

  if (userConfig.build?.lib == null) {
    config.build!.lib = {
      entry: forgeConfigSelf.entry,
      fileName: () => '[name].js',
      formats: ['cjs'],
    };
  }

  return mergeConfig(mergeConfig(buildConfig, config), userConfig);
}
