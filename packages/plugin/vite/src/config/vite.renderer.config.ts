import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import { pluginExposeRenderer } from './vite.base.config.js';

// https://vitejs.dev/config
export function getConfig(
  forgeEnv: ConfigEnv<'renderer'>,
  userConfig: UserConfig = {},
) {
  const { root, mode, command, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? '';

  const config: UserConfig = {
    root,
    mode,
    // Packaged renderers are loaded from disk with `loadFile`, so their asset
    // URLs have to be relative. The dev server is served over HTTP, where
    // Vite's default `/` base keeps the client and HMR URLs working.
    ...(command === 'build' ? { base: './' } : {}),
    build: {
      copyPublicDir: true,
      outDir: `.vite/renderer/${name}`,
      // Electron's Chromium supports `<link rel="modulepreload">` natively.
      modulePreload: { polyfill: false },
      // Gzip sizes are meaningless for code shipped inside an asar.
      reportCompressedSize: false,
    },
    plugins: [pluginExposeRenderer(name)],
    resolve: {
      preserveSymlinks: true,
    },
    clearScreen: false,
  };

  return mergeConfig(config, userConfig);
}
