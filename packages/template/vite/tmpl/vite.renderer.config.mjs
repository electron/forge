import { defineConfig } from 'vite';
import { pluginExposeRenderer } from './vite.base.config.mjs';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const { root, mode, forgeConfigSelf } = env;
  const name = forgeConfigSelf.name ?? '';

  /** @type {import('vite').UserConfig} */
  return {
    root,
    mode,
    base: './',
    build: {
      outDir: `.vite/renderer/${name}`,
    },
    plugins: [pluginExposeRenderer(name)],
    resolve: {
      preserveSymlinks: true,
    },
    clearScreen: false,
  };
});
