import { getDevtronBootstrapCode } from '@electron-forge/core-utils';
import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

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
  const { command, forgeConfig, forgeConfigSelf } = forgeEnv;
  const define = getBuildDefine(forgeEnv);
  // Only inject Devtron into dev builds — `command` is only ever 'serve'
  // during `electron-forge start`.
  const injectDevtron = Boolean(forgeConfig.devtron) && command === 'serve';
  const config: UserConfig = {
    build: {
      copyPublicDir: false,
      rollupOptions: {
        external: [
          ...external,
          'electron/main',
          ...(injectDevtron ? ['@electron/devtron'] : []),
        ],
        ...(injectDevtron
          ? {
              // The banner is raw code prepended to the emitted CJS bundle,
              // so Rollup never parses it; `@electron/devtron` is resolved
              // from the app's node_modules at runtime.
              output: { banner: getDevtronBootstrapCode() },
            }
          : {}),
      },
    },
    plugins: [
      ...(forgeEnv.forgeConfig.hotRestart ? [pluginHotRestart('restart')] : []),
    ],
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
