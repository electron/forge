import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import { pluginExposeRenderer } from './vite.base.config';

// https://vitejs.dev/config
export function getConfig(
  forgeEnv: ConfigEnv<'renderer'>,
  userConfig: UserConfig = {},
) {
  const { root, mode, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? '';

  const config: UserConfig = {
    root,
    mode,
    base: './',
    build: {
      copyPublicDir: true,
      outDir: `.vite/renderer/${name}`,
    },
    plugins: [pluginExposeRenderer(name)],
    resolve: {
      preserveSymlinks: true,
    },
    clearScreen: false,
  };

  return mergeConfig(config, userConfig);
}
