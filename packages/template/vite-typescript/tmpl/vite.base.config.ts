import { builtinModules } from 'node:module';
import type { AddressInfo } from 'node:net';
import type { ConfigEnv, Plugin, UserConfig } from 'vite';
import pkg from './package.json';

export const builtins = ['electron', ...builtinModules.map((m) => [m, `node:${m}`]).flat()];

export const external = [...builtins, ...Object.keys('dependencies' in pkg ? (pkg.dependencies as Record<string, unknown>) : {})];

export function configFn(env: ConfigEnv & { root: string }): UserConfig {
  return {
    root: env.root,
    mode: env.mode,
    build: {
      // Prevent multiple builds from interfering with each other.
      emptyOutDir: false,
      // 🚧 Multiple builds may conflict.
      outDir: '.vite/build',
      watch: env.command === 'serve' ? {} : null,
      minify: env.command === 'build',
    },
    clearScreen: false,
  };
}

export function getDefineKeys(name: string) {
  const NAME = name.toUpperCase();

  return {
    VITE_DEV_SERVER_URL: `${NAME}_VITE_DEV_SERVER_URL`,
    VITE_NAME: `${NAME}_VITE_NAME`,
  };
}

export function pluginExposeRenderer(name: string): Plugin {
  const { VITE_DEV_SERVER_URL } = getDefineKeys(name);

  return {
    name: '@electron-forge/plugin-vite:expose-renderer',
    configureServer(server) {
      process.viteDevServer = server;

      server.httpServer?.once('listening', () => {
        const addressInfo = server.httpServer!.address() as AddressInfo;
        process.env[VITE_DEV_SERVER_URL] = `http://localhost:${addressInfo?.port}`;
      });
    },
  };
}

export function pluginHotRestart(type: 'restart' | 'reload'): Plugin {
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
}
