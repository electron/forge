import { defineConfig, mergeConfig } from 'vite';
import { configFn, external } from './vite.base.config.mjs';
import { name as mainWindowName } from './vite.renderer.config.mjs';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const { VITE_DEV_SERVER_URL, VITE_NAME } = getDefineKeys(mainWindowName);
  /** @type {import('vite').UserConfig} */
  const config = {
    build: {
      lib: {
        entry: 'src/main.js',
        fileName: () => '[name].js',
        formats: ['cjs'],
      },
      rollupOptions: {
        external,
      },
    },
    define: {
      [VITE_DEV_SERVER_URL]: env.command === 'serve'
        ? JSON.stringify(process.env[VITE_DEV_SERVER_URL])
        : undefined,
      [VITE_NAME]: JSON.stringify(mainWindowName),
    },
  };

  return mergeConfig(configFn(env), config);
});
