import path from 'node:path';

import { expect } from 'chai';

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

    expect(buildConfig.root).equal(configRoot);
    expect(buildConfig.mode).equal('production');
    expect(buildConfig.build?.emptyOutDir).false;
    expect(buildConfig.build?.outDir).equal('.vite/build');
    expect(buildConfig.build?.watch).null;
    expect(buildConfig.build?.minify).true;
    expect(buildConfig.build?.lib && buildConfig.build.lib.entry).equal('src/main.js');
    expect(buildConfig.build?.lib && (buildConfig.build.lib.fileName as () => string)()).equal('[name].js');
    expect(buildConfig.build?.lib && buildConfig.build.lib.formats).deep.equal(['cjs']);
    expect(buildConfig.build?.rollupOptions?.external).deep.equal(external);
    expect(buildConfig.clearScreen).false;
    expect(buildConfig.plugins?.map((plugin) => (plugin as Plugin).name)).deep.equal(['@electron-forge/plugin-vite:hot-restart']);
    expect(buildConfig.define).deep.equal({});
    expect(buildConfig.resolve).deep.equal({
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

    expect(buildConfig.root).equal(configRoot);
    expect(buildConfig.mode).equal('production');
    expect(buildConfig.build?.emptyOutDir).false;
    expect(buildConfig.build?.outDir).equal('.vite/build');
    expect(buildConfig.build?.watch).null;
    expect(buildConfig.build?.minify).true;
    expect(buildConfig.build?.rollupOptions?.external).deep.equal(external);
    expect(buildConfig.build?.rollupOptions?.input).equal('src/preload.js');
    expect(buildConfig.build?.rollupOptions?.output).deep.equal({
      format: 'cjs',
      inlineDynamicImports: true,
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
      assetFileNames: '[name].[ext]',
    });
    expect(buildConfig.clearScreen).false;
    expect(buildConfig.plugins?.map((plugin) => (plugin as Plugin).name)).deep.equal(['@electron-forge/plugin-vite:hot-restart']);
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

    expect(rendererConfig.root).equal(configRoot);
    expect(rendererConfig.mode).equal('production');
    expect(rendererConfig.base).equal('./');
    expect(rendererConfig.build?.outDir).equal('.vite/renderer/main_window');
    expect(rendererConfig.plugins?.map((plugin) => (plugin as Plugin).name)).deep.equal(['@electron-forge/plugin-vite:expose-renderer']);
    expect(rendererConfig.resolve).deep.equal({ preserveSymlinks: true });
    expect(rendererConfig.clearScreen).false;
  });
});
