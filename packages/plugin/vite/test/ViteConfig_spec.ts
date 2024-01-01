import { AddressInfo } from 'node:net';
import path from 'node:path';

import { expect } from 'chai';
import { UserConfig, default as vite, ViteDevServer } from 'vite';

import { VitePluginConfig } from '../src/Config';
import ViteConfigGenerator from '../src/ViteConfig';

describe('ViteConfigGenerator', () => {
  it('is `getDefines` will be gets auto-updated `server.port`', async () => {
    const config = {
      renderer: [{ name: 'foo_window' }, { name: 'bar_window' }],
    } as VitePluginConfig;
    const generator = new ViteConfigGenerator(config, '', false);
    const servers: ViteDevServer[] = [];

    for (const userConfig of await generator.getRendererConfig()) {
      const viteDevServer = await vite.createServer({
        configFile: false,
        ...userConfig,
      });

      await viteDevServer.listen();
      viteDevServer.printUrls();
      servers.push(viteDevServer);

      // Make suee that `getDefines` in VitePlugin.ts gets the correct `server.port`. (#3198)
      const addressInfo = viteDevServer.httpServer!.address() as AddressInfo;
      userConfig.server ??= {};
      userConfig.server.port = addressInfo.port;
    }

    const define = await generator.getDefines();

    for (const server of servers) {
      server.close();
    }
    servers.length = 0;

    expect(define.FOO_WINDOW_VITE_DEV_SERVER_URL).equal('"http://localhost:5173"');
    expect(define.FOO_WINDOW_VITE_NAME).equal('"foo_window"');
    expect(define.BAR_WINDOW_VITE_DEV_SERVER_URL).equal('"http://localhost:5174"');
    expect(define.BAR_WINDOW_VITE_NAME).equal('"bar_window"');
  });

  it('getBuildConfig', async () => {
    const config = {
      build: [{ entry: 'foo.js' }],
      renderer: [],
    } as VitePluginConfig;
    const generator = new ViteConfigGenerator(config, '', true);
    const buildConfig = (await generator.getBuildConfig())[0];
    expect(buildConfig).deep.equal({
      mode: 'production',
      build: {
        lib: {
          entry: 'foo.js',
          formats: ['cjs'],
          // shims
          fileName: (buildConfig.build?.lib as any)?.fileName,
        },
        emptyOutDir: false,
        outDir: path.join('.vite', 'build'),
        watch: undefined,
        minify: true, // this.isProd === true
      },
      clearScreen: false,
      define: {},
      // shims
      plugins: [buildConfig.plugins?.[0]],
    } as UserConfig);
  });

  it('getRendererConfig', async () => {
    const config = {
      renderer: [{ name: 'foo_window' }, { name: 'bar_window' }],
    } as VitePluginConfig;
    const generator = new ViteConfigGenerator(config, '', false);
    const configs = await generator.getRendererConfig();
    for (const [index, rendererConfig] of configs.entries()) {
      expect(rendererConfig).deep.equal({
        mode: 'development',
        base: './',
        build: {
          outDir: path.join('.vite', 'renderer', config.renderer[index].name),
        },
        clearScreen: false,
      } as UserConfig);
    }
  });
});
