import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import {
  applyNativeModuleOverrides,
  detectNativePackages,
} from '../detect-native-modules.js';
import {
  external,
  getBuildConfig,
  pluginHotRestart,
} from './vite.base.config.js';

export function getConfig(
  forgeEnv: ConfigEnv<'build'>,
  userConfig: UserConfig = {},
): UserConfig {
  const { forgeConfig, forgeConfigSelf } = forgeEnv;
  const nativePackages = applyNativeModuleOverrides(
    detectNativePackages(forgeEnv.root),
    forgeConfig.nativeModules,
  );
  const config: UserConfig = {
    build: {
      copyPublicDir: false,
      rollupOptions: {
        external: [...external, 'electron/renderer', ...nativePackages],
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: forgeConfigSelf.entry,
        output: {
          format: 'cjs',
          // Preload scripts require a single entrypoint.
          codeSplitting: false,
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
    },
    plugins: [pluginHotRestart('reload')],
  };
  const buildConfig = getBuildConfig(forgeEnv);

  return mergeConfig(mergeConfig(buildConfig, config), userConfig);
}
