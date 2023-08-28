import path from 'path';

import { expect } from 'chai';
import { Compiler, Configuration, Entry, WebpackPluginInstance } from 'webpack';

import { WebpackConfiguration, WebpackPluginConfig, WebpackPluginEntryPoint } from '../src/Config';
import AssetRelocatorPatch from '../src/util/AssetRelocatorPatch';
import WebpackConfigGenerator, { ConfigurationFactory } from '../src/WebpackConfig';

const mockProjectDir = process.platform === 'win32' ? 'C:\\path' : '/path';

type WebpackPlugin = ((this: Compiler, compiler: Compiler) => void) | WebpackPluginInstance;

function hasAssetRelocatorPatchPlugin(plugins?: WebpackPlugin[]): boolean {
  return (plugins || []).some((plugin: WebpackPlugin) => plugin instanceof AssetRelocatorPatch);
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

describe('WebpackConfigGenerator', () => {
  describe('rendererTarget', () => {
    it('is web if undefined', async () => {
      const config = {
        renderer: {
          entryPoints: [{ name: 'foo', js: 'foo/index.js' }],
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].target).to.equal('web');
    });

    it('is web if false', async () => {
      const config = {
        renderer: {
          entryPoints: [{ name: 'foo', js: 'foo/index.js' }],
          nodeIntegration: false,
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].target).to.equal('web');
    });

    it('is electron-renderer if true', async () => {
      const config = {
        renderer: {
          entryPoints: [{ name: 'foo', js: 'foo/index.js' }],
          nodeIntegration: true,
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].target).to.equal('electron-renderer');
    });

    it('is web if entry nodeIntegration is false', async () => {
      const config = {
        renderer: {
          entryPoints: [{ name: 'foo', js: 'foo/index.js', nodeIntegration: false }],
          nodeIntegration: true,
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].target).to.equal('web');
    });
  });

  describe('getDefines', () => {
    it('throws an error if renderer.entryPoints does not exist', () => {
      const config = {
        renderer: {},
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      expect(() => generator.getDefines()).to.throw(/renderer.entryPoints.* has not been defined/);
    });

    it('throws an error if renderer.entryPoints is not an array', () => {
      const config = {
        renderer: {
          entryPoints: {},
        },
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      expect(() => generator.getDefines()).to.throw(/renderer.entryPoints.* has not been defined/);
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

      expect(defines.HELLO_WEBPACK_ENTRY).to.equal("'http://localhost:3000/hello/index.js'");
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
      const defines = generator.getDefines(false);

      expect(defines.HELLO_WEBPACK_ENTRY).to.equal("`file://${require('path').resolve(__dirname, '..', '.', 'hello', 'index.js')}`");
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

      expect(defines.HELLO_WEBPACK_ENTRY).to.equal("'http://localhost:3000/hello'");
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
          expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).to.equal(String.raw`'C:\\path\\.webpack\\renderer\\window\\preload.js'`);
        } else {
          expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).to.equal(`'${mockProjectDir}/.webpack/renderer/window/preload.js'`);
        }
      });

      it('should assign an expression to resolve the preload script in production', () => {
        const generator = new WebpackConfigGenerator(config, mockProjectDir, true, 3000);
        const defines = generator.getDefines();
        expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).to.equal("require('path').resolve(__dirname, '../renderer', 'window', 'preload.js')");
      });
    });
  });

  describe('getMainConfig', () => {
    it('fails when there is no mainConfig.entry', async () => {
      const config = {
        mainConfig: {},
      } as WebpackPluginConfig;
      const generator = new WebpackConfigGenerator(config, '/', false, 3000);
      await expect(generator.getMainConfig()).to.be.rejectedWith('Required option "mainConfig.entry" has not been defined');
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
      expect(webpackConfig.target).to.equal('electron-main');
      expect(webpackConfig.mode).to.equal('development');
      expect(webpackConfig.entry).to.equal('main.js');
      expect(webpackConfig.output).to.deep.equal({
        path: path.join(mockProjectDir, '.webpack', 'main'),
        filename: 'index.js',
        libraryTarget: 'commonjs2',
      });
      expect(hasAssetRelocatorPatchPlugin(webpackConfig.plugins)).to.equal(false);
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
      expect(webpackConfig.mode).to.equal('production');
      expect(hasAssetRelocatorPatchPlugin(webpackConfig.plugins)).to.equal(false);
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
      expect(webpackConfig.entry).to.equal(path.join(mockProjectDir, 'foo', 'main.js'));
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
      expect(webpackConfig.entry).to.deep.equal({
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
      expect(webpackConfig.entry).to.equal(path.resolve(baseDir, 'foo/main.js'));
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
      ).to.deep.equal(modelWebpackConfig);

      // Check promise form
      expect(
        await generateWebpackConfig(async () => ({
          entry: 'main.js',
          ...sampleWebpackConfig,
        }))
      ).to.deep.equal(modelWebpackConfig);
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
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].target).to.deep.equal('electron-renderer');
      expect(webpackConfig[0].mode).to.equal('development');
      expect(webpackConfig[0].entry).to.deep.equal({
        main: ['rendererScript.js'],
      });
      expect(webpackConfig[0].output).to.deep.equal({
        path: path.join(mockProjectDir, '.webpack', 'renderer'),
        filename: '[name]/index.js',
        globalObject: 'self',
        publicPath: '/',
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).to.equal(1);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).to.equal(true);
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
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].entry).to.deep.equal({
        main: ['rendererScript.js'],
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).to.equal(2);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).to.equal(true);
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
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].target).to.equal('web');
      expect(webpackConfig[0].mode).to.equal('development');
      expect(webpackConfig[0].entry).to.deep.equal({
        main: ['rendererScript.js'],
      });
      expect(webpackConfig[0].output).to.deep.equal({
        path: path.join(mockProjectDir, '.webpack', 'renderer'),
        filename: '[name]/preload.js',
        globalObject: 'self',
        publicPath: '/',
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).to.equal(2);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).to.equal(true);
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
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].target).to.deep.equal('web');
      expect(webpackConfig[0].mode).to.equal('production');
      expect(webpackConfig[0].entry).to.deep.equal({
        main: ['rendererScript.js'],
      });
      expect(webpackConfig[0].output).to.deep.equal({
        path: path.join(mockProjectDir, '.webpack', 'renderer'),
        filename: '[name]/index.js',
        globalObject: 'self',
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).to.equal(1);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).to.equal(true);
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
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].target).to.equal('web');
      expect(webpackConfig[0].mode).to.equal('production');
      expect(webpackConfig[0].entry).to.deep.equal({ main: ['preload.js'] });
      expect(webpackConfig[0].output).to.deep.equal({
        path: path.join(mockProjectDir, '.webpack', 'renderer'),
        filename: '[name]/preload.js',
        globalObject: 'self',
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).to.equal(2);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).to.equal(true);
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
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].target).to.deep.equal('web');
      expect(webpackConfig[0].mode).to.equal('production');
      expect(webpackConfig[0].entry).to.deep.equal({
        main: ['rendererScript.js'],
      });
      expect(webpackConfig[0].output).to.deep.equal({
        path: path.join(mockProjectDir, '.webpack', 'renderer'),
        filename: '[name]/preload.js',
        globalObject: 'self',
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(webpackConfig[0].plugins!.length).to.equal(2);
      expect(hasAssetRelocatorPatchPlugin(webpackConfig[0].plugins)).to.equal(true);
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
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].target).to.equal('web');
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
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].target).to.equal('electron-preload');
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
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig[0].target).to.equal('web');
      expect(webpackConfig[0].name).to.equal('preload');
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
      const webpackConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      expect(webpackConfig.length).to.equal(4);
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
        return generator.getRendererConfig(config.renderer.entryPoints);
      };

      const modelWebpackConfig = await generateWebpackConfig({
        ...sampleWebpackConfig,
      });

      // Check fn form
      expect(
        await generateWebpackConfig(() => ({
          ...sampleWebpackConfig,
        }))
      ).to.deep.equal(modelWebpackConfig);

      // Check promise form
      expect(
        await generateWebpackConfig(async () => ({
          ...sampleWebpackConfig,
        }))
      ).to.deep.equal(modelWebpackConfig);
    });
  });

  describe('preprocessConfig', () => {
    context('when overriden in subclass', () => {
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

        expect(getInvokedCounter()).to.equal(0);

        await generator.getMainConfig();
        expect(getInvokedCounter()).to.equal(1);

        await generator.getRendererConfig(config.renderer.entryPoints);
        expect(getInvokedCounter()).to.equal(2);
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

        expect(getInvokedCounter()).to.equal(0);

        await generator.getMainConfig();
        expect(getInvokedCounter()).to.equal(1);

        await generator.getRendererConfig(config.renderer.entryPoints);
        expect(getInvokedCounter()).to.equal(2);
      });
    });
  });
});
