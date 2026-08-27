import { builtinModules } from 'node:module';

import { getAppProtocolEntryUrl } from './app-protocol.js';

import type { AddressInfo } from 'node:net';
import type { ConfigEnv, Plugin, UserConfig, ViteDevServer } from 'vite';

export const external = [
  'electron',
  'electron/common',
  ...builtinModules.map((m) => [m, `node:${m}`]).flat(),
];

// Used for hot reload after preload scripts.
const viteDevServers: Record<string, ViteDevServer> = {};
export const viteDevServerUrls: Record<string, string> = {};

export function getBuildConfig(env: ConfigEnv<'build'>): UserConfig {
  const { root, mode, command } = env;

  return {
    root,
    mode,
    build: {
      // Prevent multiple builds from interfering with each other.
      emptyOutDir: false,
      // 🚧 Multiple builds may conflict.
      outDir: '.vite/build',
      watch: command === 'serve' ? { exclude: '**/.git/**' } : null,
      minify: command === 'build',
    },
    clearScreen: false,
  };
}

export function getDefineKeys(names: string[]) {
  const define: { [name: string]: VitePluginRuntimeKeys } = {};

  // change name from kebab case to upper snake case to agree with vite:define plugin
  // this allows the VitePluginRendererConfig entries to contain names with dashes

  return names.reduce((acc, name) => {
    const NAME = name.toUpperCase().replaceAll('-', '_');
    const keys: VitePluginRuntimeKeys = {
      VITE_DEV_SERVER_URL: `${NAME}_VITE_DEV_SERVER_URL`,
      VITE_NAME: `${NAME}_VITE_NAME`,
      VITE_ENTRY: `${NAME}_VITE_ENTRY`,
    };

    return { ...acc, [name]: keys };
  }, define);
}

export function getBuildDefine(env: ConfigEnv<'build'>) {
  const { command, forgeConfig } = env;
  const names = forgeConfig.renderer
    .filter(({ name }) => name != null)
    .map(({ name }) => name!);
  const defineKeys = getDefineKeys(names);
  const define = Object.entries(defineKeys).reduce(
    (acc, [name, keys]) => {
      const { VITE_DEV_SERVER_URL, VITE_NAME, VITE_ENTRY } = keys;
      const def = {
        [VITE_DEV_SERVER_URL]:
          command === 'serve'
            ? JSON.stringify(viteDevServerUrls[VITE_DEV_SERVER_URL])
            : undefined,
        [VITE_NAME]: JSON.stringify(name),
        // A single entry URL usable in both development and production: the
        // dev server URL while serving, and (when `appProtocol` is enabled)
        // the `app://` URL served by the injected protocol handler in builds.
        [VITE_ENTRY]:
          command === 'serve'
            ? JSON.stringify(viteDevServerUrls[VITE_DEV_SERVER_URL])
            : forgeConfig.appProtocol
              ? JSON.stringify(getAppProtocolEntryUrl(name))
              : undefined,
      };
      return { ...acc, ...def };
    },
    {} as Record<string, any>,
  );

  return define;
}

export function pluginExposeRenderer(name: string): Plugin {
  const { VITE_DEV_SERVER_URL } = getDefineKeys([name])[name];

  return {
    name: '@electron-forge/plugin-vite:expose-renderer',
    configureServer(server) {
      // Expose server for preload scripts hot reload.
      viteDevServers[name] = server;

      server.httpServer?.once('listening', () => {
        const addressInfo = server.httpServer?.address() as AddressInfo;
        // Expose env constant for main process use.
        viteDevServerUrls[VITE_DEV_SERVER_URL] =
          `http://localhost:${addressInfo?.port}`;
      });
    },
  };
}

export function pluginHotRestart(command: 'reload' | 'restart'): Plugin {
  return {
    name: '@electron-forge/plugin-vite:hot-restart',
    closeBundle() {
      if (command === 'reload') {
        for (const server of Object.values(viteDevServers)) {
          // Preload scripts hot reload.
          server.ws.send({ type: 'full-reload' });
        }
      } else if (command === 'restart') {
        // Main process hot restart.
        // https://github.com/electron/forge/blob/v7.2.0/packages/api/core/src/api/start.ts#L216-L223
        // TODO: blocked in #3380
        // process.stdin.emit('data', 'rs');
      }
    },
  };
}
