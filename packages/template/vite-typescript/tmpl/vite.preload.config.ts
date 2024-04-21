import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig, mergeConfig } from 'vite';
import { getBuildConfig, external, esmodule, pluginHotRestart } from './vite.base.config';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<'build'>;
  const { forgeConfigSelf } = forgeEnv;
  const ext = esmodule ? 'mjs' : 'js';
  const config: UserConfig = {
    build: {
      rollupOptions: {
        external,
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: forgeConfigSelf.entry!,
        output: {
          // https://github.com/electron-vite/vite-plugin-electron/blob/v0.28.5/README.md#built-format
          // https://github.com/electron-vite/vite-plugin-electron/blob/v0.28.5/src/simple.ts#L56-L82
          format: 'cjs',
          // It should not be split chunks.
          inlineDynamicImports: true,
          entryFileNames: `[name].${ext}`,
          chunkFileNames: `[name].${ext}`,
          assetFileNames: '[name].[ext]',
        },
      },
    },
    plugins: [pluginHotRestart('reload')],
  };

  return mergeConfig(getBuildConfig(forgeEnv), config);
});
