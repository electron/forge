import { builtinModules } from 'node:module';
import { styleText } from 'node:util';

import { requestAppRestart } from '@electron-forge/core-utils/restart';

import {
  getAppProtocolEntryUrl,
  resolveAppProtocolConfig,
} from '@electron-forge/core-utils';

import type { AddressInfo } from 'node:net';
import type {
  ConfigEnv,
  Plugin,
  Rollup,
  UserConfig,
  ViteDevServer,
} from 'vite';

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

/**
 * Name of the global that carries a renderer's packaged `file://` entry URL
 * when `appProtocol` is off — the define substitutes reads of the entry
 * constant with it, and {@link pluginViteEntryFallback}'s banner assigns it.
 */
function viteEntryFallbackGlobal(viteEntryKey: string): string {
  return `__electronForge_${viteEntryKey}`;
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
                // an app that calls `loadURL(MAIN_WINDOW_VITE_ENTRY)` and
                // later turns the option off keeps working when packaged
                // instead of failing only in production with
                // `loadURL(undefined)`. The value must stay a bare member
                // expression — the one non-JSON define shape esbuild
                // (Vite < 8) accepts — so the actual file:// URL is assigned
                // by pluginViteEntryFallback's banner, which sees the
                // bundle's real output format. A define could not: a CJS
                // require() expression throws in an ESM main bundle, and
                // import.meta is a syntax error in a CJS one.
                `globalThis.${viteEntryFallbackGlobal(VITE_ENTRY)}`,
      };
      return { ...acc, ...def };
    },
    {} as Record<string, any>,
  );

  return define;
}

/**
 * Resolve the host to use in the dev server URL exposed to the main process.
 * Wildcard hosts (`true`, `0.0.0.0`, `::`) are mapped to `localhost` since the
 * main process runs on the same machine and wildcard addresses are not
 * reliably loadable in Chromium.
 */
function resolveDevHost(host: string | boolean | undefined): string {
  if (typeof host !== 'string' || host === '0.0.0.0' || host === '::') {
    return 'localhost';
  }
  // IPv6 literals must be bracketed in URLs.
  return host.includes(':') ? `[${host}]` : host;
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
          `http://${resolveDevHost(server.config.server.host)}:${addressInfo?.port}`;
      });
    },
  };
}

function prependOutputBanner(
  output: Rollup.OutputOptions,
  banner: string,
): Rollup.OutputOptions {
  const existing = output.banner;
  return {
    ...output,
    banner:
      typeof existing === 'function'
        ? async (chunk) => banner + (await existing(chunk))
        : banner + (existing ?? ''),
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
      // Rollup defaults to 'es' when no format is set.
      const format = output.format ?? 'es';
      const isCjs = format === 'cjs' || format === 'commonjs';
      const isEsm = format === 'es' || format === 'esm' || format === 'module';
      if (!isCjs && !isEsm) {
        // Prepending the runtime anyway would surface as a cryptic
        // ReferenceError at app startup; fail the build instead.
        throw new Error(
          `[@electron-forge/plugin-vite] appProtocol requires the main-process bundle to be CommonJS or ESM, but it is built with output format '${format}'.`,
        );
      }
      const banner = isCjs
        ? // The banner sits above Rollup's own 'use strict' prologue
          // directive, which stops being a directive once displaced — so
          // re-assert it at file level here. (The shared banner itself must
          // not carry a file-level directive: webpack's BannerPlugin path
          // would force bundled sloppy-mode CJS deps strict.)
          `'use strict';\n${runtime}`
        : // The shared runtime is CommonJS; a user's own `build.lib.formats:
          // ['es']` skips the plugin's CJS default, so give the runtime
          // `require`/`__dirname` bindings scoped to a block — module-level
          // consts could collide with Rollup's own createRequire shims.
          [
            `import { createRequire as __electronForgeAppProtocolCreateRequire } from 'node:module';`,
            `{`,
            `const require = __electronForgeAppProtocolCreateRequire(import.meta.url);`,
            `const __dirname = require('node:path').dirname(require('node:url').fileURLToPath(import.meta.url));`,
            runtime,
            `}`,
          ].join('\n');
      return prependOutputBanner(output, banner);
    },
  };
}

/**
 * Assigns each renderer's packaged `file://` entry URL to the global that the
 * `*_VITE_ENTRY` define points at when `appProtocol` is off. Runs in
 * `outputOptions`, where the bundle's actual output format is known, so the
 * URL is computed with `require()`/`__dirname` in CJS bundles and
 * `import.meta.url` in ESM ones — neither expression is valid in the other
 * format, which is why the define itself cannot carry it.
 */
export function pluginViteEntryFallback(names: string[]): Plugin {
  return {
    name: '@electron-forge/plugin-vite:vite-entry-fallback',
    outputOptions(output) {
      // Rollup defaults to 'es' when no format is set.
      const format = output.format ?? 'es';
      const isCjs = format === 'cjs' || format === 'commonjs';
      const isEsm = format === 'es' || format === 'esm' || format === 'module';
      if (!isCjs && !isEsm) {
        // umd/iife/etc. are not Electron main-process formats; leave the
        // globals unset so the entry constants read as undefined.
        return null;
      }
      const assignments = Object.entries(getDefineKeys(names)).map(
        ([name, { VITE_ENTRY }]) => {
          const global = `globalThis.${viteEntryFallbackGlobal(VITE_ENTRY)}`;
          // JSON.stringify the path — this path runs without appProtocol's
          // renderer-name validation, so a name containing a quote must not
          // break the emitted code. pathToFileURL/the URL resolver encode
          // '#', '?' and '%' in install paths the way the loadFile call this
          // replaces did; for the URL resolver the name segment is
          // percent-encoded at build time since it joins a URL, not a path.
          return isCjs
            ? `${global} = require('node:url').pathToFileURL(require('node:path').join(__dirname, ${JSON.stringify(`../renderer/${name}/index.html`)})).href;`
            : `${global} = new URL(${JSON.stringify(`../renderer/${encodeURIComponent(name)}/index.html`)}, import.meta.url).href;`;
        },
      );
      // In CJS the banner displaces Rollup's 'use strict' prologue directive,
      // so re-assert it (ESM is strict implicitly).
      const banner =
        (isCjs ? `'use strict';\n` : '') + assignments.join('\n') + '\n';
      return prependOutputBanner(output, banner);
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
