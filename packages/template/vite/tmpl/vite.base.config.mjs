import { builtinModules } from 'node:module';
import pkg from './package.json';

export const builtins = [
  'electron',
  ...builtinModules.map((m) => [m, `node:${m}`]).flat(),
];

export const external = [...builtins, ...Object.keys(pkg.dependencies || {})];

/** @type {(env: import('vite').ConfigEnv & { root: string; }) => import('vite').UserConfig} */
export const configFn = (env) => ({
  root: env.root,
  mode: env.mode,
  build: {
    // Prevent multiple builds from interfering with each other.
    emptyOutDir: false,
    // 🚧 Multiple builds may conflict.
    outDir: '.vite/build',
    minify: env.command === 'build',
    watch: env.command === 'serve' ? {} : null,
  },
  clearScreen: false,
});

/** @type {(name: string) => { VITE_DEV_SERVER_URL: string; VITE_NAME: string }} */
export const getDefineKeys = (name) => {
  const NAME = name.toUpperCase();

  return {
    VITE_DEV_SERVER_URL: `${NAME}_VITE_DEV_SERVER_URL`,
    VITE_NAME: `${NAME}_VITE_NAME`,
  };
};

/** @type {(name: string) => import('vite').Plugin} */
export const pluginExposeRenderer = (name) => {
  const { VITE_DEV_SERVER_URL } = getDefineKeys(name);

  return {
    name: '@electron-forge/plugin-vite:expose-renderer',
    configureServer(server) {
      process.viteDevServer = server;

      server.httpServer?.once('listening', () => {
        /** @type {import('node:net').AddressInfo} */
        const addressInfo = server.httpServer?.address();
        process.env[
          VITE_DEV_SERVER_URL
        ] = `http://localhost:${addressInfo?.port}`;
      });
    },
  };
};

/** @type {(type: 'restart' | 'reload') => import('vite').Plugin} */
export const pluginHotRestart = (type) => {
  return {
    name: '@electron-forge/plugin-vite:hot-restart',
    closeBundle() {
      if (type === 'restart') {
        // https://github.com/electron/forge/blob/v7.2.0/packages/api/core/src/api/start.ts#L216-L223
        process.stdin.emit('data', 'rs');
      } else {
        process.viteDevServer.ws.send({ type: 'full-reload' });
      }
    },
  };
};
