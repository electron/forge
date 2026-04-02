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
  const { forgeConfigSelf, forgeConfig } = forgeEnv;
  const isEsm = forgeConfig.outputFormat === 'es';
  const define = getBuildDefine(forgeEnv);
  const config: UserConfig = {
    build: {
      copyPublicDir: false,
      rollupOptions: {
        external: [...external, 'electron/main'],
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
      fileName: () => (isEsm ? '[name].mjs' : '[name].cjs'),
      formats: [isEsm ? 'es' : 'cjs'],
    };
  }

  return mergeConfig(mergeConfig(buildConfig, config), userConfig);
}
