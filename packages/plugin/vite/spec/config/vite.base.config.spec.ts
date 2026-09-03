import path from 'node:path';

import { setAppRestartHandler } from '@electron-forge/core-utils/restart';
import { createServer } from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getBuildDefine,
  getDefineKeys,
  pluginExposeRenderer,
  pluginHotRestart,
} from '../../src/config/vite.base.config';

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
      // does not break only when packaged.
      MAIN_WINDOW_VITE_ENTRY:
        "require('node:url').pathToFileURL(require('node:path').join(__dirname, \"../renderer/main_window/index.html\")).href",
      SECOND_WINDOW_VITE_DEV_SERVER_URL: undefined,
      SECOND_WINDOW_VITE_NAME: '"second_window"',
      SECOND_WINDOW_VITE_ENTRY:
        "require('node:url').pathToFileURL(require('node:path').join(__dirname, \"../renderer/second_window/index.html\")).href",
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
