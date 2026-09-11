import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { external } from '../src/config/vite.base.config';
import ViteConfigGenerator from '../src/ViteConfig';

import type { VitePluginConfig } from '../src/Config';
import type { Plugin } from 'vite';

const configRoot = path.join(import.meta.dirname, 'fixtures/vite-configs');

describe('ViteConfigGenerator', () => {
  it('getBuildConfigs:main', async () => {
    const forgeConfig: VitePluginConfig = {
      build: [
        {
          entry: 'src/main.js',
          config: path.join(configRoot, 'vite.main.config.mjs'),
          target: 'main',
        },
      ],
      renderer: [],
    };
    const generator = new ViteConfigGenerator(forgeConfig, configRoot, true);
    const buildConfig = (await generator.getBuildConfigs())[0];

    expect(buildConfig.root).toEqual(configRoot);
    expect(buildConfig.mode).toEqual('production');
    expect(buildConfig.build?.emptyOutDir).toBe(false);
    expect(buildConfig.build?.outDir).toEqual('.vite/build');
    expect(buildConfig.build?.watch).toBeNull();
    expect(buildConfig.build?.minify).toBe(true);
    expect(buildConfig.build?.lib && buildConfig.build.lib.entry).toEqual(
      'src/main.js',
    );
    expect(
      buildConfig.build?.lib &&
        (buildConfig.build.lib.fileName as () => string)(),
    ).toEqual('[name].js');
    expect(buildConfig.build?.lib && buildConfig.build.lib.formats).toEqual([
      'cjs',
    ]);
    expect(buildConfig.build?.rollupOptions?.external).toEqual([
      ...external,
      'electron/main',
    ]);
    expect(buildConfig.clearScreen).toBe(false);
    // Hot restart is opt-in, so the main config carries no plugins by default.
    expect(buildConfig.plugins).toEqual([]);
    expect(buildConfig.define).toEqual({});
    expect(buildConfig.resolve).toEqual({
      conditions: ['node'],
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    });
  });

  it('getBuildConfigs:main adds the hot restart plugin when hotRestart is enabled', async () => {
    const forgeConfig: VitePluginConfig = {
      build: [
        {
          entry: 'src/main.js',
          config: path.join(configRoot, 'vite.main.config.mjs'),
          target: 'main',
        },
      ],
      renderer: [],
      hotRestart: true,
    };
    const generator = new ViteConfigGenerator(forgeConfig, configRoot, true);
    const buildConfig = (await generator.getBuildConfigs())[0];

    expect(
      buildConfig.plugins?.map((plugin) => (plugin as Plugin).name),
    ).toEqual(['@electron-forge/plugin-vite:hot-restart']);
  });

  it('getBuildConfigs:preload', async () => {
    const forgeConfig: VitePluginConfig = {
      build: [
        {
          entry: 'src/preload.js',
          config: path.join(configRoot, 'vite.preload.config.mjs'),
          target: 'preload',
        },
      ],
      renderer: [],
    };
    const generator = new ViteConfigGenerator(forgeConfig, configRoot, true);
    const buildConfig = (await generator.getBuildConfigs())[0];

    expect(buildConfig.root).toEqual(configRoot);
    expect(buildConfig.mode).toEqual('production');
    expect(buildConfig.build?.emptyOutDir).toBe(false);
    expect(buildConfig.build?.outDir).toEqual('.vite/build');
    expect(buildConfig.build?.watch).toBeNull();
    expect(buildConfig.build?.minify).toBe(true);
    expect(buildConfig.build?.rollupOptions?.external).toEqual([
      ...external,
      'electron/renderer',
    ]);
    expect(buildConfig.build?.rollupOptions?.input).toEqual('src/preload.js');
    expect(buildConfig.build?.rollupOptions?.output).toEqual({
      format: 'cjs',
      codeSplitting: false,
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
      assetFileNames: '[name].[ext]',
    });
    expect(buildConfig.clearScreen).toBe(false);
    // Preload scripts are reloaded, never restarted, regardless of `hotRestart`.
    expect(
      buildConfig.plugins?.map((plugin) => (plugin as Plugin).name),
    ).toEqual(['@electron-forge/plugin-vite:hot-reload']);
  });

  describe('devtron', () => {
    const devtronForgeConfig = (devtron?: boolean): VitePluginConfig => ({
      build: [
        {
          entry: 'src/main.js',
          config: path.join(configRoot, 'vite.main.config.mjs'),
          target: 'main',
        },
      ],
      renderer: [],
      devtron,
    });

    const mainOutput = (config: {
      build?: { rollupOptions?: { output?: unknown } };
    }) =>
      config.build?.rollupOptions?.output as { banner?: string } | undefined;

    it('injects the bootstrap banner into dev main builds when enabled', async () => {
      const generator = new ViteConfigGenerator(
        devtronForgeConfig(true),
        configRoot,
        false,
      );
      const buildConfig = (await generator.getBuildConfigs())[0];
      expect(mainOutput(buildConfig)?.banner).toContain('@electron/devtron');
      expect(buildConfig.build?.rollupOptions?.external).toContain(
        '@electron/devtron',
      );
    });

    it('does not inject the bootstrap into production builds', async () => {
      const generator = new ViteConfigGenerator(
        devtronForgeConfig(true),
        configRoot,
        true,
      );
      const buildConfig = (await generator.getBuildConfigs())[0];
      expect(mainOutput(buildConfig)?.banner).toBeUndefined();
      expect(buildConfig.build?.rollupOptions?.external).not.toContain(
        '@electron/devtron',
      );
    });

    it('does not inject the bootstrap when not enabled', async () => {
      const generator = new ViteConfigGenerator(
        devtronForgeConfig(),
        configRoot,
        false,
      );
      const buildConfig = (await generator.getBuildConfigs())[0];
      expect(mainOutput(buildConfig)?.banner).toBeUndefined();
    });
  });

  it('getRendererConfig:renderer', async () => {
    const forgeConfig = {
      build: [],
      renderer: [
        {
          name: 'main_window',
          config: path.join(configRoot, 'vite.renderer.config.mjs'),
        },
      ],
    };
    const generator = new ViteConfigGenerator(forgeConfig, configRoot, true);
    const rendererConfig = (await generator.getRendererConfig())[0];

    expect(rendererConfig.root).toEqual(configRoot);
    expect(rendererConfig.mode).toEqual('production');
    expect(rendererConfig.base).toEqual('./');
    expect(rendererConfig.build?.outDir).toEqual('.vite/renderer/main_window');
    expect(
      rendererConfig.plugins?.map((plugin) => (plugin as Plugin).name),
    ).toEqual(['@electron-forge/plugin-vite:expose-renderer']);
    expect(rendererConfig.resolve).toEqual({ preserveSymlinks: true });
    expect(rendererConfig.clearScreen).toBe(false);
  });
});
