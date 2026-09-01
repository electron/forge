import { builtinModules } from 'node:module';
import { styleText } from 'node:util';

import { requestAppRestart } from '@electron-forge/core-utils/restart';

import {
  getAppProtocolEntryUrl,
  resolveAppProtocolConfig,
} from '@electron-forge/core-utils';

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
  const appProtocol = forgeConfig.appProtocol
    ? resolveAppProtocolConfig(forgeConfig.appProtocol)
    : undefined;
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
            : appProtocol
              ? JSON.stringify(getAppProtocolEntryUrl(name, appProtocol.scheme))
              : // Keep the constant a valid URL without `appProtocol` too, so
                // an app that calls `loadURL(MAIN_WINDOW_VITE_ENTRY)` and later
                // turns the option off keeps working when packaged instead of
                // failing only in production with `loadURL(undefined)`.
                `\`file://\${require('node:path').join(__dirname, '../renderer/${name}/index.html')}\``,
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

/**
 * Prepends the appProtocol runtime to the main-process bundle. Implemented as
 * a plugin rather than `build.rollupOptions.output.banner` so that a user's
 * own `banner` in their Vite config composes with the runtime instead of
 * silently replacing it (plugin arrays concatenate under `mergeConfig`;
 * plain config values do not).
 */
export function pluginAppProtocolRuntime(runtime: string): Plugin {
  return {
    name: '@electron-forge/plugin-vite:app-protocol-runtime',
    outputOptions(output) {
      const existing = output.banner;
      return {
        ...output,
        banner:
          typeof existing === 'function'
            ? async (chunk) => runtime + (await existing(chunk))
            : runtime + (existing ?? ''),
      };
    },
  };
}

export function pluginHotRestart(command: 'reload' | 'restart'): Plugin {
  let builtOnce = false;

  return {
    name: `@electron-forge/plugin-vite:hot-${command}`,
    closeBundle(error) {
      const isRebuild = builtOnce;
      builtOnce = true;

      // Rollup passes the build error here before rethrowing it. The bundle on
      // disk is stale in that case, so reloading or restarting would silently
      // run the previous build's code.
      if (error) return;

      if (command === 'reload') {
        for (const server of Object.values(viteDevServers)) {
          // Preload scripts hot reload.
          server.ws.send({ type: 'full-reload' });
        }
      } else if (command === 'restart' && !requestAppRestart() && isRebuild) {
        // The first build finishes before the app is spawned, so only a rebuild
        // that fails to reach it is worth warning about.
        console.warn(
          styleText(
            'yellow',
            '[@electron-forge/plugin-vite] Rebuilt the main process bundle, but the running app was not restarted, so it is still running the previous code.',
          ),
        );
      }
    },
  };
}
