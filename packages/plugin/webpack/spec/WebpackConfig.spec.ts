import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { Configuration, Entry } from 'webpack';

import {
  WebpackConfiguration,
  WebpackPluginConfig,
  WebpackPluginEntryPoint,
} from '../src/Config';
import AssetRelocatorPatch from '../src/util/AssetRelocatorPatch';
import WebpackConfigGenerator, {
  ConfigurationFactory,
} from '../src/WebpackConfig';

const mockProjectDir = process.platform === 'win32' ? 'C:\\path' : '/path';

function hasAssetRelocatorPatchPlugin(
  plugins?: Required<Configuration>['plugins'],
): boolean {
  return (plugins || []).some(
    (plugin) =>
      plugin &&
      typeof plugin === 'object' &&
      plugin instanceof AssetRelocatorPatch,
  );
}

const sampleWebpackConfig = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|webp)$/,
        use: 'file-loader',
      },
    ],
  },
};

const safeFirstRendererConfig = (renderer: WebpackPluginConfig['renderer']) => {
  if (Array.isArray(renderer)) return renderer[0];
  return renderer;
};

describe('WebpackConfigGenerator', () => {
  describe('rendererTarget', () => {
    it('is web if undefined', async () => {
      const config = {
        renderer: {
          entryPoints: [{ name: 'foo', js: 'foo/index.js' }],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].target).toEqual('web');
    });

    it('is web if false', async () => {
      const config = {
        renderer: {
          entryPoints: [{ name: 'foo', js: 'foo/index.js' }],
          nodeIntegration: false,
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].target).toEqual('web');
    });

    it('is electron-renderer if true', async () => {
      const config = {
        renderer: {
          entryPoints: [{ name: 'foo', js: 'foo/index.js' }],
          nodeIntegration: true,
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].target).toEqual('electron-renderer');
    });

    it('is web if entry nodeIntegration is false', async () => {
      const config = {
        renderer: {
          entryPoints: [
            { name: 'foo', js: 'foo/index.js', nodeIntegration: false },
          ],
          nodeIntegration: true,
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].target).toEqual('web');
    });
  });

  describe('getDefines', () => {
    it('throws an error if renderer.entryPoints does not exist', () => {
      const config = {
        renderer: {},
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      expect(() => generator.getDefines()).toThrow(
        /renderer.entryPoints.* has not been defined/,
      );
    });

    it('throws an error if renderer.entryPoints is not an array', () => {
      const config = {
        renderer: {
          entryPoints: {},
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      expect(() => generator.getDefines()).toThrow(
        /renderer.entryPoints.* has not been defined/,
      );
    });

    it('sets the renderer entry point to a JS file in development', () => {
      const config = {
        renderer: {
          entryPoints: [
            {
              name: 'hello',
              js: 'foo.js',
            },
          ],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      const defines = generator.getDefines();

      expect(defines.HELLO_WEBPACK_ENTRY).toEqual(
        "'http://localhost:3000/hello/index.js'",
      );
    });

    it('sets the renderer entry point to a JS file in production', () => {
      const config = {
        renderer: {
          entryPoints: [
            {
              name: 'hello',
              js: 'foo.js',
            },
          ],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', true, 3000);
      const defines = generator.getDefines();

      expect(defines.HELLO_WEBPACK_ENTRY).toEqual(
        "`file://${require('path').resolve(__dirname, '..', 'renderer', 'hello', 'index.js')}`",
      );
    });

    it('sets the renderer entry point to an HTML file if both an HTML & JS file are specified', () => {
      const config = {
        renderer: {
          entryPoints: [
            {
              name: 'hello',
              html: 'foo.html',
              js: 'foo.js',
            },
          ],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      const defines = generator.getDefines();

      expect(defines.HELLO_WEBPACK_ENTRY).toEqual(
        "'http://localhost:3000/hello/index.html'",
      );
    });

    describe('appProtocol', () => {
      it('sets HTML renderer entry points to app:// URLs in production', () => {
        const config = {
          appProtocol: true,
          renderer: {
            entryPoints: [
              {
                name: 'hello',
                html: 'foo.html',
                js: 'foo.js',
              },
            ],
          },
        } as WebpackPluginConfig;
        const generator = new WebpackConfigGenerator(config, '/', true, 3000);
        const defines = generator.getDefines();

        // The per-entry subdirectory is part of the path: every origin is
        // rooted at the shared `.webpack/renderer/` directory so that
        // `publicPath: '/'` asset URLs resolve.
        expect(defines.HELLO_WEBPACK_ENTRY).toEqual(
          "'app://hello/hello/index.html'",
        );
      });

      it('keeps nodeIntegration entry points on file:// in production', () => {
        // Electron only derives renderer __dirname from file: URLs, which
        // AssetRelocatorPatch relies on for nodeIntegration renderers.
        const config = {
          appProtocol: true,
          renderer: {
            entryPoints: [
              {
                name: 'hello',
                html: 'foo.html',
                js: 'foo.js',
                nodeIntegration: true,
              },
            ],
          },
        } as WebpackPluginConfig;
        const generator = new WebpackConfigGenerator(config, '/', true, 3000);
        const defines = generator.getDefines();

        expect(defines.HELLO_WEBPACK_ENTRY).toEqual(
          "`file://${require('path').resolve(__dirname, '..', 'renderer', 'hello', 'index.html')}`",
        );
      });

      it('uses a custom scheme for entry URLs when configured', () => {
        const config = {
          appProtocol: { scheme: 'myapp' },
          renderer: {
            entryPoints: [
              {
                name: 'hello',
                html: 'foo.html',
                js: 'foo.js',
              },
            ],
          },
        } as WebpackPluginConfig;
        const generator = new WebpackConfigGenerator(config, '/', true, 3000);
        const defines = generator.getDefines();

        expect(defines.HELLO_WEBPACK_ENTRY).toEqual(
          "'myapp://hello/hello/index.html'",
        );
      });

      it('keeps JS-only entry points on file:// in production', () => {
        const config = {
          appProtocol: true,
          renderer: {
            entryPoints: [
              {
                name: 'hello',
                js: 'foo.js',
              },
            ],
          },
        } as WebpackPluginConfig;
        const generator = new WebpackConfigGenerator(config, '/', true, 3000);
        const defines = generator.getDefines();

        expect(defines.HELLO_WEBPACK_ENTRY).toEqual(
          "`file://${require('path').resolve(__dirname, '..', 'renderer', 'hello', 'index.js')}`",
        );
      });

      it('keeps dev server URLs in development', () => {
        const config = {
          appProtocol: true,
          renderer: {
            entryPoints: [
              {
                name: 'hello',
                html: 'foo.html',
                js: 'foo.js',
              },
            ],
          },
        } as WebpackPluginConfig;
        const generator = new WebpackConfigGenerator(config, '/', false, 3000);
        const defines = generator.getDefines();

        expect(defines.HELLO_WEBPACK_ENTRY).toEqual(
          "'http://localhost:3000/hello/index.html'",
        );
      });
    });

    describe('PRELOAD_WEBPACK_ENTRY', () => {
      const config = {
        mainConfig: {},
        renderer: {
          config: {},
          entryPoints: [
            {
              html: 'index.html',
              js: 'window.js',
              name: 'window',
              preload: {
                js: 'preload.js',
              },
            },
          ],
        },
      };

      it('should assign absolute preload script path in development', () => {
        const generator = new WebpackConfigGenerator(
          config,
          mockProjectDir,
          false,
          3000,
        );
        const defines = generator.getDefines();

        if (process.platform === 'win32') {
          expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).toEqual(
            String.raw`'C:\\path\\.webpack\\renderer\\window\\preload.js'`,
          );
        } else {
          expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).toEqual(
            `'${mockProjectDir}/.webpack/renderer/window/preload.js'`,
          );
        }
      });

      it('should assign an expression to resolve the preload script in production', () => {
        const generator = new WebpackConfigGenerator(
          config,
          mockProjectDir,
          true,
          3000,
        );
        const defines = generator.getDefines();
        expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).toEqual(
          "require('path').resolve(__dirname, '../renderer', 'window', 'preload.js')",
        );
      });
    });
  });

  describe('getMainConfig', () => {
    it('fails when there is no mainConfig.entry', async () => {
      const config = {
        mainConfig: {},
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      await expect(generator.getMainConfig()).rejects.toThrow(
        'Required option "mainConfig.entry" has not been defined',
      );
    });

    it('generates a development config', async () => {
      const config = {
        mainConfig: {
          entry: 'main.js',
        },
        renderer: {
          entryPoints: [] as WebpackPluginEntryPoint[],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        false,
        3000,
      );
      const webpackConfig = await generator.getMainConfig();
      expect(webpackConfig.target).toEqual('electron-main');
      expect(webpackConfig.mode).toEqual('development');
      expect(webpackConfig.entry).toEqual('main.js');
      expect(webpackConfig.output).toEqual({
        path: path.join(mockProjectDir, '.webpack', 'main'),
        filename: 'index.js',
        libraryTarget: 'commonjs2',
      });
      expect(hasAssetRelocatorPatchPlugin(webpackConfig.plugins)).toEqual(
        false,
      );
    });

    it('generates a production config', async () => {
      const config = {
        mainConfig: {
          entry: 'main.js',
        },
        renderer: {
          entryPoints: [] as WebpackPluginEntryPoint[],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        true,
        3000,
      );
      const webpackConfig = await generator.getMainConfig();
      expect(webpackConfig.mode).toEqual('production');
      expect(hasAssetRelocatorPatchPlugin(webpackConfig.plugins)).toEqual(
        false,
      );
    });

    describe('appProtocol runtime injection', () => {
      const appProtocolConfig = {
        mainConfig: {
          entry: 'main.js',
        },
        renderer: {
          entryPoints: [
            {
              name: 'main_window',
              html: 'index.html',
              js: 'renderer.js',
            },
            {
              name: 'worker',
              preload: {
                js: 'preload.js',
              },
            },
          ],
        },
        appProtocol: true,
      } as WebpackPluginConfig;

      const findBannerPlugin = (plugins: unknown[] | undefined) =>
        plugins?.find(
          (plugin) => plugin?.constructor?.name === 'BannerPlugin',
        ) as { options: { banner: string; raw: boolean } } | undefined;

      it('injects the runtime banner into production main configs', async () => {
        const generator = new WebpackConfigGenerator(
          appProtocolConfig,
          mockProjectDir,
          true,
          3000,
        );
        const webpackConfig = await generator.getMainConfig();
        const bannerPlugin = findBannerPlugin(webpackConfig.plugins);
        expect(bannerPlugin).toBeDefined();
        expect(bannerPlugin!.options.raw).toBe(true);
        expect(bannerPlugin!.options.banner).toContain(
          'registerSchemesAsPrivileged',
        );
        // Window entry points are served; preload-only entries are not.
        expect(bannerPlugin!.options.banner).toContain('["main_window"]');
      });

      it('includes additional privileged schemes from the object form', async () => {
        const generator = new WebpackConfigGenerator(
          {
            ...appProtocolConfig,
            appProtocol: {
              additionalPrivilegedSchemes: [
                { scheme: 'media', privileges: { stream: true } },
              ],
            },
          },
          mockProjectDir,
          true,
          3000,
        );
        const webpackConfig = await generator.getMainConfig();
        const bannerPlugin = findBannerPlugin(webpackConfig.plugins);
        expect(bannerPlugin!.options.banner).toContain('"media"');
        expect(bannerPlugin!.options.banner).toContain('"stream":true');
      });

      it('only registers privileged schemes in development', async () => {
        // Schemes must carry the same privileges under `electron-forge start`
        // as in the packaged app, but the dev server serves the renderers, so
        // the protocol handler itself is production-only.
        const generator = new WebpackConfigGenerator(
          appProtocolConfig,
          mockProjectDir,
          false,
          3000,
        );
        const webpackConfig = await generator.getMainConfig();
        const bannerPlugin = findBannerPlugin(webpackConfig.plugins);
        expect(bannerPlugin).toBeDefined();
        expect(bannerPlugin!.options.banner).toContain(
          'registerSchemesAsPrivileged',
        );
        expect(bannerPlugin!.options.banner).not.toContain('protocol.handle');
      });

      it('injects only the serving handler with registerSchemes: false', async () => {
        const generator = new WebpackConfigGenerator(
          { ...appProtocolConfig, appProtocol: { registerSchemes: false } },
          mockProjectDir,
          true,
          3000,
        );
        const webpackConfig = await generator.getMainConfig();
        const bannerPlugin = findBannerPlugin(webpackConfig.plugins);
        expect(bannerPlugin!.options.banner).toContain('protocol.handle');
        expect(bannerPlugin!.options.banner).not.toContain(
          'registerSchemesAsPrivileged',
        );
      });

      it('injects nothing in development with registerSchemes: false', async () => {
        const generator = new WebpackConfigGenerator(
          { ...appProtocolConfig, appProtocol: { registerSchemes: false } },
          mockProjectDir,
          false,
          3000,
        );
        const webpackConfig = await generator.getMainConfig();
        expect(findBannerPlugin(webpackConfig.plugins)).toBeUndefined();
      });

      it('tolerates unservable names on entries the scheme never serves', async () => {
        // `toEnvironmentVariable` supports names with spaces and file://
        // tolerated them; JS-only entries stay on file://, so their names
        // must be neither host-validated nor allowlisted.
        const generator = new WebpackConfigGenerator(
          {
            ...appProtocolConfig,
            renderer: {
              entryPoints: [
                { name: 'main_window', html: 'index.html', js: 'renderer.js' },
                { name: 'background worker', js: 'worker.js' },
              ],
            },
          },
          mockProjectDir,
          true,
          3000,
        );
        const webpackConfig = await generator.getMainConfig();
        const bannerPlugin = findBannerPlugin(webpackConfig.plugins);
        expect(bannerPlugin!.options.banner).toContain('["main_window"]');
        expect(bannerPlugin!.options.banner).not.toContain('background worker');
      });

      it('splits served and unserved entries into separate compilations in production', async () => {
        const rendererOptions = {
          config: {},
          entryPoints: [
            { name: 'main_window', html: 'index.html', js: 'renderer.js' },
            { name: 'background_worker', js: 'worker.js' },
          ],
        };
        const generator = new WebpackConfigGenerator(
          { ...appProtocolConfig, renderer: rendererOptions },
          mockProjectDir,
          true,
          3000,
        );
        const configs = await generator.getRendererConfig(
          rendererOptions as WebpackPluginRendererConfig,
        );
        const webConfigs = configs.filter((config) => config.target === 'web');
        expect(webConfigs).toHaveLength(2);
        const servedConfig = webConfigs.find(
          (config) => (config.entry as Entry)['main_window'],
        );
        const unservedConfig = webConfigs.find(
          (config) => (config.entry as Entry)['background_worker'],
        );
        // The served compilation needs root-relative asset URLs; the JS-only
        // one must keep webpack's 'auto' script-relative resolution for
        // file:// loading.
        expect(servedConfig?.output?.publicPath).toEqual('/');
        expect(unservedConfig?.output?.publicPath).toBeUndefined();
      });

      it('uses root-relative publicPath for served renderers in production', async () => {
        const rendererOptions = {
          config: {},
          entryPoints: [
            {
              name: 'main_window',
              html: 'index.html',
              js: 'renderer.js',
            },
          ],
        };
        const generator = new WebpackConfigGenerator(
          { ...appProtocolConfig, renderer: rendererOptions },
          mockProjectDir,
          true,
          3000,
        );
        const configs = await generator.getRendererConfig(
          rendererOptions as WebpackPluginRendererConfig,
        );
        const webConfig = configs.find((config) => config.target === 'web');
        expect(webConfig?.output?.publicPath).toEqual('/');
      });

      it('does not inject the banner when appProtocol is not enabled', async () => {
        const generator = new WebpackConfigGenerator(
          { ...appProtocolConfig, appProtocol: undefined },
          mockProjectDir,
          true,
          3000,
        );
        const webpackConfig = await generator.getMainConfig();
        expect(findBannerPlugin(webpackConfig.plugins)).toBeUndefined();
      });
    });

    it('generates a config with a relative entry path', async () => {
      const config = {
        mainConfig: {
          entry: './foo/main.js',
        },
        renderer: {
          entryPoints: [] as WebpackPluginEntryPoint[],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        true,
        3000,
      );
      const webpackConfig = await generator.getMainConfig();
      expect(webpackConfig.entry).toEqual(
        path.join(mockProjectDir, 'foo', 'main.js'),
      );
    });

    it('generates a config with multiple entries', async () => {
      const config = {
        mainConfig: {
          entry: {
            foo: './foo/main.js',
            bar: 'bar.js',
          } as Entry,
        },
        renderer: {
          entryPoints: [] as WebpackPluginEntryPoint[],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        true,
        3000,
      );
      const webpackConfig = await generator.getMainConfig();
      expect(webpackConfig.entry).toEqual({
        foo: path.join(mockProjectDir, 'foo', 'main.js'),
        bar: 'bar.js',
      });
    });

    it('generates a config from a requirable file', async () => {
      const config = {
        mainConfig: 'mainConfig.cjs',
        renderer: {
          entryPoints: [] as WebpackPluginEntryPoint[],
        },
      } as WebpackPluginConfig;
      const baseDir = path.resolve(__dirname, 'fixtures/main_config_external');
      const generator = new WebpackConfigGenerator(config, baseDir, true, 3000);
      const webpackConfig = await generator.getMainConfig();
      expect(webpackConfig.entry).toEqual(path.resolve(baseDir, 'foo/main.js'));
    });

    it('generates a config from a requirable transpiled module file', async () => {
      const config = {
        mainConfig: 'mainConfig.module.cjs',
        renderer: {
          entryPoints: [] as WebpackPluginEntryPoint[],
        },
      } as WebpackPluginConfig;
      const baseDir = path.resolve(__dirname, 'fixtures/main_config_external');
      const generator = new WebpackConfigGenerator(config, baseDir, true, 3000);
      const webpackConfig = await generator.getMainConfig();
      expect(webpackConfig.entry).toEqual(path.resolve(baseDir, 'foo/main.js'));
    });

    it('generates a config from function', async () => {
      const generateWebpackConfig = (webpackConfig: WebpackConfiguration) => {
        const config = {
          mainConfig: webpackConfig,
          renderer: {
            entryPoints: [] as WebpackPluginEntryPoint[],
          },
        } as WebpackPluginConfig;
        const generator = new WebpackConfigGenerator(
          config,
          mockProjectDir,
          false,
          3000,
        );
        return generator.getMainConfig();
      };

      const modelWebpackConfig = await generateWebpackConfig({
        entry: 'main.js',
        ...sampleWebpackConfig,
      });

      // Check fn form
      expect(
        await generateWebpackConfig(() => ({
          entry: 'main.js',
          ...sampleWebpackConfig,
        })),
      ).toEqual(modelWebpackConfig);

      // Check promise form
      expect(
        await generateWebpackConfig(async () => ({
          entry: 'main.js',
          ...sampleWebpackConfig,
        })),
      ).toEqual(modelWebpackConfig);
    });
  });

  describe('getRendererConfig', () => {
    it('generates a development config', async () => {
      const config = {
        renderer: {
          entryPoints: [
            {
              name: 'main',
              js: 'rendererScript.js',
            },
          ],
          nodeIntegration: true,
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        false,
        3000,
      );
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].target).toEqual('electron-renderer');
      expect(webpackConfig[0].mode).toEqual('development');
      expect(webpackConfig[0].entry).toEqual({
        main: ['rendererScript.js'],
      });
      expect(webpackConfig[0].output).toEqual({
        path: path.join(mockProjectDir, '.webpack', 'renderer'),
        filename: '[name]/index.js',
        globalObject: 'self',
        publicPath: '/',
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).toEqual(1);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).toEqual(
        true,
      );
    });

    it('generates a development config with an HTML endpoint', async () => {
      const config = {
        renderer: {
          entryPoints: [
            {
              name: 'main',
              html: 'renderer.html',
              js: 'rendererScript.js',
            },
          ],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        false,
        3000,
      );
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].entry).toEqual({
        main: ['rendererScript.js'],
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).toEqual(2);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).toEqual(
        true,
      );
    });

    it('generates a preload-only development config', async () => {
      const config = {
        renderer: {
          entryPoints: [
            {
              name: 'main',
              preload: {
                js: 'rendererScript.js',
              },
            },
          ],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        false,
        3000,
      );
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].target).toEqual('web');
      expect(webpackConfig[0].mode).toEqual('development');
      expect(webpackConfig[0].entry).toEqual({
        main: ['rendererScript.js'],
      });
      expect(webpackConfig[0].output).toEqual({
        path: path.join(mockProjectDir, '.webpack', 'renderer'),
        filename: '[name]/preload.js',
        globalObject: 'self',
        publicPath: '/',
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).toEqual(2);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).toEqual(
        true,
      );
    });

    it('generates a production config', async () => {
      const config = {
        renderer: {
          entryPoints: [
            {
              name: 'main',
              js: 'rendererScript.js',
            },
          ],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        true,
        3000,
      );
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].target).toEqual('web');
      expect(webpackConfig[0].mode).toEqual('production');
      expect(webpackConfig[0].entry).toEqual({
        main: ['rendererScript.js'],
      });
      expect(webpackConfig[0].output).toEqual({
        path: path.join(mockProjectDir, '.webpack', 'renderer'),
        filename: '[name]/index.js',
        globalObject: 'self',
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).toEqual(1);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).toEqual(
        true,
      );
    });

    it('generates a production config with entryPoint preload', async () => {
      const config = {
        renderer: {
          entryPoints: [
            {
              name: 'main',
              preload: {
                js: 'preload.js',
              },
            },
          ],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        true,
        3000,
      );
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].target).toEqual('web');
      expect(webpackConfig[0].mode).toEqual('production');
      expect(webpackConfig[0].entry).toEqual({ main: ['preload.js'] });
      expect(webpackConfig[0].output).toEqual({
        path: path.join(mockProjectDir, '.webpack', 'renderer'),
        filename: '[name]/preload.js',
        globalObject: 'self',
        publicPath: '',
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).toEqual(2);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).toEqual(
        true,
      );
    });

    it('generates a preload-only production config', async () => {
      const config = {
        renderer: {
          entryPoints: [
            {
              name: 'main',
              preload: {
                js: 'rendererScript.js',
              },
            },
          ],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        true,
        3000,
      );
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].target).toEqual('web');
      expect(webpackConfig[0].mode).toEqual('production');
      expect(webpackConfig[0].entry).toEqual({
        main: ['rendererScript.js'],
      });
      expect(webpackConfig[0].output).toEqual({
        path: path.join(mockProjectDir, '.webpack', 'renderer'),
        filename: '[name]/preload.js',
        globalObject: 'self',
        publicPath: '',
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).toEqual(2);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).toEqual(
        true,
      );
    });

    it('can override the renderer target', async () => {
      const config = {
        renderer: {
          config: {
            target: 'web',
          },
          entryPoints: [
            {
              name: 'main',
              js: 'renderer.js',
            },
          ],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        true,
        3000,
      );
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].target).toEqual('web');
    });

    it('prevents the preload target from being overridden', async () => {
      const config = {
        renderer: {
          config: {
            target: 'web',
          },
          entryPoints: [
            {
              name: 'main',
              preload: {
                js: 'preload.js',
              },
              nodeIntegration: true,
            },
          ],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        true,
        3000,
      );
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].target).toEqual('electron-preload');
    });

    it('allows you to specify a preload webpack config', async () => {
      const config = {
        renderer: {
          config: {
            target: 'web',
            name: 'renderer',
            entry: 'renderer',
          },
          entryPoints: [
            {
              name: 'main',
              preload: {
                js: 'preload.js',
                config: {
                  name: 'preload',
                  target: 'electron-preload',
                  entry: 'preload',
                },
              },
            },
          ],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        true,
        3000,
      );
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig[0].target).toEqual('web');
      expect(webpackConfig[0].name).toEqual('preload');
    });

    it('generates up to 4 rendererConfigs instead of 1 per entrypoint', async () => {
      const config = {
        renderer: {
          config: {
            target: 'web',
          },
          entryPoints: [
            {
              name: '1',
              preload: {
                js: 'preload.js',
              },
            },
            {
              name: '2',
              preload: {
                js: 'preload.js',
              },
              nodeIntegration: true,
            },
            {
              html: './src/mediaPlayer/index.html',
              js: './src/mediaPlayer/index.tsx',
              name: '3',
            },
            {
              html: './src/mediaPlayer/index.html',
              js: './src/mediaPlayer/index.tsx',
              name: '4',
              nodeIntegration: true,
            },
            {
              js: './src/background/background.ts',
              name: '5',
            },
            {
              js: './src/background/background.ts',
              name: '6',
              nodeIntegration: true,
            },
          ],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(
        config,
        mockProjectDir,
        true,
        3000,
      );
      const webpackConfig = await generator.getRendererConfig(
        safeFirstRendererConfig(config.renderer),
      );
      expect(webpackConfig.length).toEqual(4);
    });

    it('generates a config from function', async () => {
      const generateWebpackConfig = (webpackConfig: WebpackConfiguration) => {
        const config = {
          renderer: {
            config: webpackConfig,
            entryPoints: [
              {
                name: 'main',
                js: 'rendererScript.js',
              },
            ],
          },
        } as WebpackPluginConfig;
        const generator = new WebpackConfigGenerator(
          config,
          mockProjectDir,
          false,
          3000,
        );
        return generator.getRendererConfig(
          safeFirstRendererConfig(config.renderer),
        );
      };

      const modelWebpackConfig = await generateWebpackConfig({
        ...sampleWebpackConfig,
      });

      // Check fn form
      expect(
        await generateWebpackConfig(() => ({
          ...sampleWebpackConfig,
        })),
      ).toEqual(modelWebpackConfig);

      // Check promise form
      expect(
        await generateWebpackConfig(async () => ({
          ...sampleWebpackConfig,
        })),
      ).toEqual(modelWebpackConfig);
    });
  });

  describe('preprocessConfig', () => {
    describe('when overriden in subclass', () => {
      const makeSubclass = () => {
        let invoked = 0;

        class MyWebpackConfigGenerator extends WebpackConfigGenerator {
          preprocessConfig = async (
            config: ConfigurationFactory,
          ): Promise<Configuration> => {
            invoked += 1;
            return config({ hello: 'world' }, {});
          };
        }

        return {
          getInvokedCounter: () => invoked,
          MyWebpackConfigGenerator,
        };
      };

      it('is not invoked for object config', async () => {
        const { MyWebpackConfigGenerator, getInvokedCounter } = makeSubclass();

        const config = {
          mainConfig: {
            entry: 'main.js',
            ...sampleWebpackConfig,
          },
          renderer: {
            config: { ...sampleWebpackConfig },
            entryPoints: [
              {
                name: 'main',
                js: 'rendererScript.js',
              },
            ],
          },
        } as WebpackPluginConfig;

        const generator = new MyWebpackConfigGenerator(
          config,
          mockProjectDir,
          false,
          3000,
        );

        expect(getInvokedCounter()).toEqual(0);

        await generator.getMainConfig();
        expect(getInvokedCounter()).toEqual(1);

        await generator.getRendererConfig(
          safeFirstRendererConfig(config.renderer),
        );
        expect(getInvokedCounter()).toEqual(2);
      });

      it('is invoked for fn config', async () => {
        const { MyWebpackConfigGenerator, getInvokedCounter } = makeSubclass();

        const config = {
          mainConfig: () => ({
            entry: 'main.js',
            ...sampleWebpackConfig,
          }),
          renderer: {
            config: () => ({ ...sampleWebpackConfig }),
            entryPoints: [
              {
                name: 'main',
                js: 'rendererScript.js',
              },
            ],
          },
        } as WebpackPluginConfig;

        const generator = new MyWebpackConfigGenerator(
          config,
          mockProjectDir,
          false,
          3000,
        );

        expect(getInvokedCounter()).toEqual(0);

        await generator.getMainConfig();
        expect(getInvokedCounter()).toEqual(1);

        await generator.getRendererConfig(
          safeFirstRendererConfig(config.renderer),
        );
        expect(getInvokedCounter()).toEqual(2);
      });
    });
  });
});
