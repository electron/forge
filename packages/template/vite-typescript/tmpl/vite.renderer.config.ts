import { type UserConfig, defineConfig } from 'vite';
import { pluginExposeRenderer } from './vite.base.config';

export const name = 'main_window';

// https://vitejs.dev/config
export default defineConfig((env) => {
  return {
    root: (env as any).root,
    mode: env.mode,
    base: './',
    build: {
      outDir: `renderer/${name}`,
    },
    plugins: [pluginExposeRenderer(name.toUpperCase())],
    clearScreen: false,
  } as UserConfig;
});
