import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import {
  external,
  getBuildConfig,
  pluginHotRestart,
} from './vite.base.config.js';

export function getConfig(
  forgeEnv: ConfigEnv<'build'>,
  userConfig: UserConfig = {},
): UserConfig {
  const { forgeConfigSelf } = forgeEnv;
  const config: UserConfig = {
    build: {
      copyPublicDir: false,
      // Preload scripts require a single entrypoint.
      codeSplitting: false,
      rollupOptions: {
        external: [...external, 'electron/renderer'],
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: forgeConfigSelf.entry,
        output: {
          format: 'cjs',
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
