import path from 'node:path';

import { setAppRestartHandler } from '@electron-forge/core-utils/restart';
import { createServer } from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getBuildDefine,
  getDefineKeys,
  pluginExposeRenderer,
  pluginHotRestart,
  pluginViteEntryFallback,
} from '../../src/config/vite.base.config';

import type { Rollup } from 'vite';

import type { VitePluginConfig } from '../../src/Config';

const configRoot = path.join(import.meta.dirname, 'fixtures/vite-configs');
const forgeConfig: VitePluginConfig = {
  build: [
    {
      entry: 'src/main.js',
      config: path.join(configRoot, 'vite.main.config.mjs'),
      target: 'main',
    },
    {
      entry: 'src/preload.js',
      config: path.join(configRoot, 'vite.preload.config.mjs'),
      target: 'preload',
    },
  ],
  renderer: [
    {
      name: 'main_window',
      config: path.join(configRoot, 'vite.renderer.config.mjs'),
    },
    {
      name: 'second_window',
      config: path.join(configRoot, 'vite.renderer.config.mjs'),
    },
  ],
};

describe('vite.base.config', () => {
  it('getDefineKeys', () => {
    const defineKeys1 = getDefineKeys(
      forgeConfig.renderer.map(({ name }) => name),
    );
    const defineKeys2 = {
      main_window: {
        VITE_DEV_SERVER_URL: 'MAIN_WINDOW_VITE_DEV_SERVER_URL',
        VITE_NAME: 'MAIN_WINDOW_VITE_NAME',
        VITE_ENTRY: 'MAIN_WINDOW_VITE_ENTRY',
      },
      second_window: {
        VITE_DEV_SERVER_URL: 'SECOND_WINDOW_VITE_DEV_SERVER_URL',
        VITE_NAME: 'SECOND_WINDOW_VITE_NAME',
        VITE_ENTRY: 'SECOND_WINDOW_VITE_ENTRY',
      },
    };

    expect(defineKeys1).toEqual(defineKeys2);
  });

  it('getBuildDefine:build', () => {
    const define1 = getBuildDefine({
      command: 'build',
      mode: 'production',
      root: configRoot,
      forgeConfig,
      forgeConfigSelf: forgeConfig.build[0],
    });
    const define2 = {
      MAIN_WINDOW_VITE_DEV_SERVER_URL: undefined,
      MAIN_WINDOW_VITE_NAME: '"main_window"',
      // Without `appProtocol`, the entry constant still resolves to a valid
      // (file://) URL in builds so `loadURL(MAIN_WINDOW_VITE_ENTRY)` app code
      // does not break only when packaged. The define must stay a bare member
      // expression (the one non-JSON shape esbuild accepts on Vite < 8);
      // pluginViteEntryFallback's banner assigns the URL to the global.
      MAIN_WINDOW_VITE_ENTRY:
        'globalThis.__electronForge_MAIN_WINDOW_VITE_ENTRY',
      SECOND_WINDOW_VITE_DEV_SERVER_URL: undefined,
      SECOND_WINDOW_VITE_NAME: '"second_window"',
      SECOND_WINDOW_VITE_ENTRY:
        'globalThis.__electronForge_SECOND_WINDOW_VITE_ENTRY',
    };

    expect(define1).toEqual(define2);
  });

  it('getBuildDefine:build with appProtocol resolves entries to app:// URLs', () => {
    const define1 = getBuildDefine({
      command: 'build',
      mode: 'production',
      root: configRoot,
      forgeConfig: { ...forgeConfig, appProtocol: true },
      forgeConfigSelf: forgeConfig.build[0],
    });
    const define2 = {
      MAIN_WINDOW_VITE_DEV_SERVER_URL: undefined,
      MAIN_WINDOW_VITE_NAME: '"main_window"',
      MAIN_WINDOW_VITE_ENTRY: '"app://main_window/index.html"',
      SECOND_WINDOW_VITE_DEV_SERVER_URL: undefined,
      SECOND_WINDOW_VITE_NAME: '"second_window"',
      SECOND_WINDOW_VITE_ENTRY: '"app://second_window/index.html"',
    };

    expect(define1).toEqual(define2);
  });

  it('getBuildDefine:build with a custom appProtocol scheme', () => {
    const define = getBuildDefine({
      command: 'build',
      mode: 'production',
      root: configRoot,
      forgeConfig: { ...forgeConfig, appProtocol: { scheme: 'myapp' } },
      forgeConfigSelf: forgeConfig.build[0],
    });

    expect(define.MAIN_WINDOW_VITE_ENTRY).toEqual(
      '"myapp://main_window/index.html"',
    );
    expect(define.SECOND_WINDOW_VITE_ENTRY).toEqual(
      '"myapp://second_window/index.html"',
    );
  });

  it('getBuildDefine:serve', async () => {
    const servers = await Promise.all(
      forgeConfig.renderer.map(({ name }) =>
        createServer({
          publicDir: false,
          plugins: [pluginExposeRenderer(name)],
        }),
      ),
    );
    let port = 5173;

    for (const server of servers) {
      await server.listen(port);
      port++;
    }

    const define1 = getBuildDefine({
      command: 'serve',
      mode: 'development',
      root: configRoot,
      forgeConfig,
      forgeConfigSelf: forgeConfig.build[0],
    });
    const define2 = {
      MAIN_WINDOW_VITE_DEV_SERVER_URL: '"http://localhost:5173"',
      MAIN_WINDOW_VITE_NAME: '"main_window"',
      MAIN_WINDOW_VITE_ENTRY: '"http://localhost:5173"',
      SECOND_WINDOW_VITE_DEV_SERVER_URL: '"http://localhost:5174"',
      SECOND_WINDOW_VITE_NAME: '"second_window"',
      SECOND_WINDOW_VITE_ENTRY: '"http://localhost:5174"',
    };

    for (const server of servers) {
      await server.close();
    }

    expect(define1).toEqual(define2);
  });

  it('getBuildDefine:serve with custom server host', async () => {
    const hosts = ['127.0.0.1', '0.0.0.0'];
    const servers = await Promise.all(
      forgeConfig.renderer.map(({ name }, index) =>
        createServer({
          publicDir: false,
          server: { host: hosts[index] },
          plugins: [pluginExposeRenderer(name)],
        }),
      ),
    );
    let port = 5183;

    for (const server of servers) {
      await server.listen(port);
      port++;
    }

    const define1 = getBuildDefine({
      command: 'serve',
      mode: 'development',
      root: configRoot,
      forgeConfig,
      forgeConfigSelf: forgeConfig.build[0],
    });
    const define2 = {
      // Custom string hosts are exposed as-is.
      MAIN_WINDOW_VITE_DEV_SERVER_URL: '"http://127.0.0.1:5183"',
      MAIN_WINDOW_VITE_NAME: '"main_window"',
      MAIN_WINDOW_VITE_ENTRY: '"http://127.0.0.1:5183"',
      // Wildcard hosts fall back to localhost.
      SECOND_WINDOW_VITE_DEV_SERVER_URL: '"http://localhost:5184"',
      SECOND_WINDOW_VITE_NAME: '"second_window"',
      SECOND_WINDOW_VITE_ENTRY: '"http://localhost:5184"',
    };

    for (const server of servers) {
      await server.close();
    }

    expect(define1).toEqual(define2);
  });

  describe('pluginViteEntryFallback', () => {
    const applyOutputOptions = (
      output: Rollup.OutputOptions,
      names = ['main_window'],
    ) => {
      const plugin = pluginViteEntryFallback(names);
      const hook = plugin.outputOptions as (
        output: Rollup.OutputOptions,
      ) => Rollup.OutputOptions | null;
      return hook.call(undefined, output);
    };

    const bannerOf = (result: Rollup.OutputOptions | null) => {
      expect(result).not.toBeNull();
      expect(typeof result!.banner).toEqual('string');
      return result!.banner as string;
    };

    it('assigns the entry global with require()/__dirname in CJS bundles', () => {
      const banner = bannerOf(applyOutputOptions({ format: 'cjs' }));
      expect(() => new Function(banner)).not.toThrow();
      // The banner displaces Rollup's own 'use strict' prologue directive, so
      // it must re-assert it.
      expect(banner).toMatch(/^'use strict';\n/);
      expect(banner).toContain(
        `globalThis.__electronForge_MAIN_WINDOW_VITE_ENTRY = require('node:url').pathToFileURL(require('node:path').join(__dirname, "../renderer/main_window/index.html")).href;`,
      );
    });

    it('assigns the entry global with import.meta.url in ESM bundles', () => {
      // A user's own `build.lib.formats: ['es']` skips the plugin's CJS
      // default — the CJS expression would throw ReferenceError there.
      const banner = bannerOf(applyOutputOptions({ format: 'es' }));
      expect(banner).toContain(
        `globalThis.__electronForge_MAIN_WINDOW_VITE_ENTRY = new URL("../renderer/main_window/index.html", import.meta.url).href;`,
      );
      expect(banner).not.toContain('require(');
      expect(banner).not.toContain(`'use strict'`);
    });

    it('treats a missing format as ESM, matching Rollup', () => {
      expect(bannerOf(applyOutputOptions({}))).toContain('import.meta.url');
    });

    it('covers every renderer in one banner', () => {
      const banner = bannerOf(
        applyOutputOptions({ format: 'cjs' }, ['main_window', 'second-window']),
      );
      expect(banner).toContain('__electronForge_MAIN_WINDOW_VITE_ENTRY');
      // Kebab-case names map to the same key the define uses.
      expect(banner).toContain('__electronForge_SECOND_WINDOW_VITE_ENTRY');
      expect(banner).toContain('"../renderer/second-window/index.html"');
    });

    it('leaves formats no Electron main process uses untouched', () => {
      expect(applyOutputOptions({ format: 'umd' })).toBeNull();
    });

    it('composes with an existing banner instead of replacing it', () => {
      const result = applyOutputOptions({
        format: 'cjs',
        banner: '/* user banner */',
      });
      const banner = bannerOf(result);
      expect(banner).toContain('__electronForge_MAIN_WINDOW_VITE_ENTRY');
      expect(banner).toMatch(/\/\* user banner \*\/$/);
    });
  });

  describe('pluginHotRestart', () => {
    let dispose: (() => void) | undefined;

    // `closeBundle` receives the build error rollup is about to rethrow, if any.
    const closeBundle = (plugin: ReturnType<typeof pluginHotRestart>) =>
      plugin.closeBundle as (error?: Error) => void;

    afterEach(() => {
      dispose?.();
      dispose = undefined;
    });

    const handleRestarts = (accepted = true) => {
      const handler = vi.fn(() => accepted);
      dispose = setAppRestartHandler(handler);
      return handler;
    };

    it('names the plugin after its mode', () => {
      expect(pluginHotRestart('restart').name).toEqual(
        '@electron-forge/plugin-vite:hot-restart',
      );
      expect(pluginHotRestart('reload').name).toEqual(
        '@electron-forge/plugin-vite:hot-reload',
      );
    });

    it('requests a restart once the bundle closes', () => {
      const handler = handleRestarts();

      closeBundle(pluginHotRestart('restart'))();

      expect(handler).toHaveBeenCalledOnce();
    });

    it('does not request a restart when the build failed', () => {
      const handler = handleRestarts();

      // The bundle on disk is stale, so restarting would run the previous code.
      closeBundle(pluginHotRestart('restart'))(new Error('syntax error'));

      expect(handler).not.toHaveBeenCalled();
    });

    it('never requests a restart in reload mode', () => {
      const handler = handleRestarts();

      // Preload rebuilds reload the renderers; they must not restart the app.
      closeBundle(pluginHotRestart('reload'))();

      expect(handler).not.toHaveBeenCalled();
    });

    it('warns when a rebuild fails to reach the running app', () => {
      const consoleWarn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      handleRestarts(false);
      const plugin = pluginHotRestart('restart');

      // The first build runs before the app is spawned, so an unhonored request
      // is expected there.
      closeBundle(plugin)();
      expect(consoleWarn).not.toHaveBeenCalled();

      closeBundle(plugin)();
      expect(consoleWarn).toHaveBeenCalledOnce();
    });

    it('stays quiet when a rebuild does reach the running app', () => {
      const consoleWarn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      handleRestarts(true);
      const plugin = pluginHotRestart('restart');

      closeBundle(plugin)();
      closeBundle(plugin)();

      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });
});
