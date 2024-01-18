import { defineConfig, mergeConfig } from 'vite';
import { configFn, external } from './vite.base.config.mjs';

// https://vitejs.dev/config
export default defineConfig((env) => {
  /** @type {import('vite').UserConfig} */
  const config = {
    build: {
      rollupOptions: {
        external,
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: 'src/preload.js',
        output: {
          format: 'cjs',
          // It should not be split chunks.
          inlineDynamicImports: true,
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
    },
  };

  return mergeConfig(configFn(env), config);
});
