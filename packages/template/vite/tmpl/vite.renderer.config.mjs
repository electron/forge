import { defineConfig } from 'vite';
import { pluginExposeRenderer } from './vite.base.config.mjs';

export const name = 'main_window';

// https://vitejs.dev/config
export default defineConfig((env) => {
  /** @type {import('vite').UserConfig} */
  return {
    root: env.root,
    mode: env.mode,
    base: './',
    build: {
      outDir: `.vite/renderer/${name}`,
    },
    plugins: [pluginExposeRenderer(name)],
    clearScreen: false,
  };
});
