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

export function pluginExposeDefineToEnv(name: string): Plugin {
  const { VITE_DEV_SERVER_URL } = getDefineKeys(name);

  return {
    name: '@electron-forge/plugin-vite:define-to-env',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const addressInfo = server.httpServer!.address() as AddressInfo;
        process.env[VITE_DEV_SERVER_URL] = `http://localhost:${addressInfo?.port}`;
      });
    },
  };
}
