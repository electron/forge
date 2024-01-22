import { builtinModules } from 'node:module';
import path from 'node:path';

import { expect } from 'chai';

import ViteConfigGenerator from '../src/ViteConfig';

import type { VitePluginConfig } from '../src/Config';
import type { UserConfig } from 'vite';

const builtins = ['electron', ...builtinModules.map((m) => [m, `node:${m}`]).flat()];
const configRoot = path.join(__dirname, 'fixture/config');

describe('ViteConfigGenerator', () => {
  it('getBuildConfig', async () => {
    const config = {
      build: [{ config: path.join(configRoot, 'vite.main.config.mjs') }],
      renderer: [],
    } as VitePluginConfig;
    const generator = new ViteConfigGenerator(config, configRoot, true);
    const buildConfig1 = (await generator.getBuildConfig())[0];
    const buildConfig2: UserConfig = {
      root: configRoot,
      mode: 'production',
      build: {
        lib: {
          entry: 'src/main.js',
          formats: ['cjs'],
          // shims
          fileName: (buildConfig1.build?.lib as any)?.fileName,
        },
        emptyOutDir: false,
        outDir: '.vite/build',
        minify: true, // this.isProd === true
        watch: null,
        rollupOptions: {
          external: builtins,
        },
      },
      clearScreen: false,
    };

    expect(buildConfig1).deep.equal(buildConfig2);
  });

  it('getRendererConfig', async () => {
    const config = {
      build: [{ config: path.join(configRoot, 'vite.renderer.config.mjs') }],
      renderer: [],
    } as VitePluginConfig;
    const generator = new ViteConfigGenerator(config, configRoot, true);
    const buildConfig1 = (await generator.getBuildConfig())[0];
    const buildConfig2: UserConfig = {
      root: configRoot,
      mode: 'production',
      base: './',
      build: {
        outDir: 'renderer/main_window',
      },
    };

    expect(buildConfig1).deep.equal(buildConfig2);
  });
});
