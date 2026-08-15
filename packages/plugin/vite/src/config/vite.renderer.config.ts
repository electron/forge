import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import { external, pluginExposeRenderer } from './vite.base.config';

// https://vitejs.dev/config
export function getConfig(
  forgeEnv: ConfigEnv<'renderer'>,
  userConfig: UserConfig = {},
) {
  const { root, mode, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? '';
  const nodeIntegration = forgeConfigSelf.nodeIntegration ?? false;

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
      ...(nodeIntegration
        ? {
            conditions: ['node'],
            mainFields: ['module', 'jsnext:main', 'jsnext'],
          }
        : {}),
    },
    ...(nodeIntegration
      ? {
          build: {
            copyPublicDir: true,
            outDir: `.vite/renderer/${name}`,
            rollupOptions: {
              external,
            },
          },
        }
      : {}),
    clearScreen: false,
  };

  return mergeConfig(config, userConfig);
}
