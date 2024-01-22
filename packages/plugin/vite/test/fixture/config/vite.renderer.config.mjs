// eslint-disable-next-line import/namespace
import { defineConfig } from 'vite';

export default defineConfig((env) => ({
  root: env.root,
  mode: env.mode,
  base: './',
  build: {
    outDir: 'renderer/main_window',
  },
}));
