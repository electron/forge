import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import { pluginExposeRenderer } from './vite.base.config.js';

// https://vitejs.dev/config
export function getConfig(
  forgeEnv: ConfigEnv<'renderer'>,
  userConfig: UserConfig = {},
) {
  const { root, mode, forgeConfigSelf, electronTargets } = forgeEnv;
  const name = forgeConfigSelf.name ?? '';

  const config: UserConfig = {
    root,
    mode,
    base: './',
    build: {
      copyPublicDir: true,
      outDir: `.vite/renderer/${name}`,
      // Target the Chromium version Electron ships instead of the generic
      // browser baseline. Left unset when Electron cannot be resolved.
      ...(electronTargets?.chrome ? { target: electronTargets.chrome } : {}),
    },
    plugins: [pluginExposeRenderer(name)],
    resolve: {
      preserveSymlinks: true,
    },
    clearScreen: false,
  };

  return mergeConfig(config, userConfig);
}
