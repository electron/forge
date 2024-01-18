import { defineConfig } from 'vite';
import { pluginExposeDefineToEnv } from './vite.base.config.mjs';

export const name = 'main_window';

// https://vitejs.dev/config
export default defineConfig((env) => {

  /** @type {import('vite').UserConfig} */
  return {
    root: env.root,
    mode: env.mode,
    base: './',
    build: {
      outDir: 'renderer/main_window',
    },
    plugins: [
      pluginExposeDefineToEnv(name),
    ],
    clearScreen: false,
  };
});
