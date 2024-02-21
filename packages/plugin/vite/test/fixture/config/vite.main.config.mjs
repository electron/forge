import { builtinModules } from 'node:module';

// eslint-disable-next-line import/namespace
import { defineConfig } from 'vite';

const builtins = [
  'electron',
  ...builtinModules.map((m) => [m, `node:${m}`]).flat(),
];

export default defineConfig((env) => ({
  root: env.root,
  mode: env.mode,
  build: {
    lib: {
      entry: 'src/main.js',
      fileName: () => '[name].js',
      formats: ['cjs'],
    },
    // Prevent multiple builds from interfering with each other.
    emptyOutDir: false,
    // 🚧 Multiple builds may conflict.
    outDir: '.vite/build',
    minify: env.command === 'build',
    watch: env.command === 'serve' ? {} : null,
    rollupOptions: {
      external: builtins,
    },
  },
  clearScreen: false,
}));
