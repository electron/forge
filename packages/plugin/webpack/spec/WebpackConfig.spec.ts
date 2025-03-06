import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { Configuration, Entry } from 'webpack';

import { WebpackConfiguration, WebpackPluginConfig, WebpackPluginEntryPoint } from '../src/Config';
import AssetRelocatorPatch from '../src/util/AssetRelocatorPatch';
import WebpackConfigGenerator, { ConfigurationFactory } from '../src/WebpackConfig';

const mockProjectDir = process.platform === 'win32' ? 'C:\\path' : '/path';

function hasAssetRelocatorPatchPlugin(plugins?: Required<Configuration>['plugins']): boolean {
  return (plugins || []).some((plugin) => plugin && typeof plugin === 'object' && plugin instanceof AssetRelocatorPatch);
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
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
      expect(webpackConfig[0].target).toEqual('electron-renderer');
    });

    it('is web if entry nodeIntegration is false', async () => {
      const config = {
        renderer: {
          entryPoints: [{ name: 'foo', js: 'foo/index.js', nodeIntegration: false }],
          nodeIntegration: true,
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
      expect(webpackConfig[0].target).toEqual('web');
    });
  });

  describe('getDefines', () => {
    it('throws an error if renderer.entryPoints does not exist', () => {
      const config = {
        renderer: {},
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      expect(() => generator.getDefines()).toThrow(/renderer.entryPoints.* has not been defined/);
    });

    it('throws an error if renderer.entryPoints is not an array', () => {
      const config = {
        renderer: {
          entryPoints: {},
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      expect(() => generator.getDefines()).toThrow(/renderer.entryPoints.* has not been defined/);
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

      expect(defines.HELLO_WEBPACK_ENTRY).toEqual("'http://localhost:3000/hello/index.js'");
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

      expect(defines.HELLO_WEBPACK_ENTRY).toEqual("`file://${require('path').resolve(__dirname, '..', 'renderer', 'hello', 'index.js')}`");
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

      expect(defines.HELLO_WEBPACK_ENTRY).toEqual("'http://localhost:3000/hello/index.html'");
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
        const generator = new WebpackConfigGenerator(config, mockProjectDir, false, 3000);
        const defines = generator.getDefines();

        if (process.platform === 'win32') {
          expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).toEqual(String.raw`'C:\\path\\.webpack\\renderer\\window\\preload.js'`);
        } else {
          expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).toEqual(`'${mockProjectDir}/.webpack/renderer/window/preload.js'`);
        }
      });

      it('should assign an expression to resolve the preload script in production', () => {
        const generator = new WebpackConfigGenerator(config, mockProjectDir, true, 3000);
        const defines = generator.getDefines();
        expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).toEqual("require('path').resolve(__dirname, '../renderer', 'window', 'preload.js')");
      });
    });
  });

  describe('getMainConfig', () => {
    it('fails when there is no mainConfig.entry', async () => {
      const config = {
        mainConfig: {},
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      await expect(generator.getMainConfig()).rejects.toThrow('Required option "mainConfig.entry" has not been defined');
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, false, 3000);
      const webpackConfig = await generator.getMainConfig();
      expect(webpackConfig.target).toEqual('electron-main');
      expect(webpackConfig.mode).toEqual('development');
      expect(webpackConfig.entry).toEqual('main.js');
      expect(webpackConfig.output).toEqual({
        path: path.join(mockProjectDir, '.webpack', 'main'),
        filename: 'index.js',
        libraryTarget: 'commonjs2',
      });
      expect(hasAssetRelocatorPatchPlugin(webpackConfig.plugins)).toEqual(false);
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, true, 3000);
      const webpackConfig = await generator.getMainConfig();
      expect(webpackConfig.mode).toEqual('production');
      expect(hasAssetRelocatorPatchPlugin(webpackConfig.plugins)).toEqual(false);
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, true, 3000);
      const webpackConfig = await generator.getMainConfig();
      expect(webpackConfig.entry).toEqual(path.join(mockProjectDir, 'foo', 'main.js'));
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, true, 3000);
      const webpackConfig = await generator.getMainConfig();
      expect(webpackConfig.entry).toEqual({
        foo: path.join(mockProjectDir, 'foo', 'main.js'),
        bar: 'bar.js',
      });
    });

    it('generates a config from a requirable file', async () => {
      const config = {
        mainConfig: 'mainConfig.js',
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
        mainConfig: 'mainConfig.module.js',
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
        const generator = new WebpackConfigGenerator(config, mockProjectDir, false, 3000);
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
        }))
      ).toEqual(modelWebpackConfig);

      // Check promise form
      expect(
        await generateWebpackConfig(async () => ({
          entry: 'main.js',
          ...sampleWebpackConfig,
        }))
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, false, 3000);
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).toEqual(true);
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, false, 3000);
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
      expect(webpackConfig[0].entry).toEqual({
        main: ['rendererScript.js'],
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).toEqual(2);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).toEqual(true);
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, false, 3000);
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).toEqual(true);
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, true, 3000);
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).toEqual(true);
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, true, 3000);
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).toEqual(true);
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, true, 3000);
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).toEqual(true);
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, true, 3000);
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, true, 3000);
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, true, 3000);
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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
      const generator = new WebpackConfigGenerator(config, mockProjectDir, true, 3000);
      const webpackConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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
        const generator = new WebpackConfigGenerator(config, mockProjectDir, false, 3000);
        return generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
      };

      const modelWebpackConfig = await generateWebpackConfig({
        ...sampleWebpackConfig,
      });

      // Check fn form
      expect(
        await generateWebpackConfig(() => ({
          ...sampleWebpackConfig,
        }))
      ).toEqual(modelWebpackConfig);

      // Check promise form
      expect(
        await generateWebpackConfig(async () => ({
          ...sampleWebpackConfig,
        }))
      ).toEqual(modelWebpackConfig);
    });
  });

  describe('preprocessConfig', () => {
    describe('when overriden in subclass', () => {
      const makeSubclass = () => {
        let invoked = 0;

        class MyWebpackConfigGenerator extends WebpackConfigGenerator {
          preprocessConfig = async (config: ConfigurationFactory): Promise<Configuration> => {
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

        const generator = new MyWebpackConfigGenerator(config, mockProjectDir, false, 3000);

        expect(getInvokedCounter()).toEqual(0);

        await generator.getMainConfig();
        expect(getInvokedCounter()).toEqual(1);

        await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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

        const generator = new MyWebpackConfigGenerator(config, mockProjectDir, false, 3000);

        expect(getInvokedCounter()).toEqual(0);

        await generator.getMainConfig();
        expect(getInvokedCounter()).toEqual(1);

        await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
        expect(getInvokedCounter()).toEqual(2);
      });
    });
  });
});
