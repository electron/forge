import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { external } from '../src/config/vite.base.config';
import ViteConfigGenerator from '../src/ViteConfig';

import type { VitePluginConfig } from '../src/Config';
import type { Plugin } from 'vite';

const configRoot = path.join(__dirname, 'fixtures/vite-configs');

describe('ViteConfigGenerator', () => {
  it('getBuildConfig:main', async () => {
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
    const buildConfig = (await generator.getBuildConfig())[0];

    expect(buildConfig.root).toEqual(configRoot);
    expect(buildConfig.mode).toEqual('production');
    expect(buildConfig.build?.emptyOutDir).toBe(false);
    expect(buildConfig.build?.outDir).toEqual('.vite/build');
    expect(buildConfig.build?.watch).toBeNull();
    expect(buildConfig.build?.minify).toBe(true);
    expect(buildConfig.build?.lib && buildConfig.build.lib.entry).toEqual('src/main.js');
    expect(buildConfig.build?.lib && (buildConfig.build.lib.fileName as () => string)()).toEqual('[name].js');
    expect(buildConfig.build?.lib && buildConfig.build.lib.formats).toEqual(['cjs']);
    expect(buildConfig.build?.rollupOptions?.external).toEqual(external);
    expect(buildConfig.clearScreen).toBe(false);
    expect(buildConfig.plugins?.map((plugin) => (plugin as Plugin).name)).toEqual(['@electron-forge/plugin-vite:hot-restart']);
    expect(buildConfig.define).toEqual({});
    expect(buildConfig.resolve).toEqual({
      conditions: ['node'],
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    });
  });

  it('getBuildConfig:preload', async () => {
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
    const buildConfig = (await generator.getBuildConfig())[0];

    expect(buildConfig.root).toEqual(configRoot);
    expect(buildConfig.mode).toEqual('production');
    expect(buildConfig.build?.emptyOutDir).toBe(false);
    expect(buildConfig.build?.outDir).toEqual('.vite/build');
    expect(buildConfig.build?.watch).toBeNull();
    expect(buildConfig.build?.minify).toBe(true);
    expect(buildConfig.build?.rollupOptions?.external).toEqual(external);
    expect(buildConfig.build?.rollupOptions?.input).toEqual('src/preload.js');
    expect(buildConfig.build?.rollupOptions?.output).toEqual({
      format: 'cjs',
      inlineDynamicImports: true,
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
      assetFileNames: '[name].[ext]',
    });
    expect(buildConfig.clearScreen).toBe(false);
    expect(buildConfig.plugins?.map((plugin) => (plugin as Plugin).name)).toEqual(['@electron-forge/plugin-vite:hot-restart']);
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
    expect(rendererConfig.plugins?.map((plugin) => (plugin as Plugin).name)).toEqual(['@electron-forge/plugin-vite:expose-renderer']);
    expect(rendererConfig.resolve).toEqual({ preserveSymlinks: true });
    expect(rendererConfig.clearScreen).toBe(false);
  });
});
