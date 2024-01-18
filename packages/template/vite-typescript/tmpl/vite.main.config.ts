import { type UserConfig, defineConfig, mergeConfig } from 'vite';
import { configFn, external, getDefineKeys } from './vite.base.config';
import { name as mainWindowName } from './vite.renderer.config';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const { VITE_DEV_SERVER_URL, VITE_NAME } = getDefineKeys(mainWindowName);
  const config: UserConfig = {
    build: {
      lib: {
        entry: 'src/main.ts',
        fileName: () => '[name].js',
        formats: ['cjs'],
      },
      rollupOptions: {
        external,
      },
    },
    define: {
      [VITE_DEV_SERVER_URL]: env.command === 'serve' ? JSON.stringify(process.env[VITE_DEV_SERVER_URL]) : undefined,
      [VITE_NAME]: JSON.stringify(mainWindowName),
    },
  };

  return mergeConfig(configFn(env as any), config);
});
