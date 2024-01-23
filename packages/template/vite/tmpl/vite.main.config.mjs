import { defineConfig, mergeConfig } from 'vite';
import {
  getBuildConfig,
  getBuildDefine,
  external,
  pluginHotRestart,
} from './vite.base.config.mjs';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const { forgeConfigSelf } = env;
  const define = getBuildDefine(env);
  const config = {
    build: {
      lib: {
        entry: forgeConfigSelf.entry,
        fileName: () => '[name].js',
        formats: ['cjs'],
      },
      rollupOptions: {
        external,
      },
    },
    plugins: [pluginHotRestart('restart')],
    define,
  };

  return mergeConfig(getBuildConfig(env), config);
});
