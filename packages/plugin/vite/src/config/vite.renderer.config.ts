import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import { pluginExposeRenderer } from './vite.base.config';
import { pluginNodeIntegration } from './vite.node-integration.config';

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
    plugins: [
      pluginExposeRenderer(name),
      ...(forgeConfigSelf.nodeIntegration ? [pluginNodeIntegration()] : []),
    ],
    resolve: {
      preserveSymlinks: true,
    },
    clearScreen: false,
  };

  return mergeConfig(config, userConfig);
}
