import { Configuration, webpack } from 'webpack';
import { join, resolve as resolvePath } from 'path';
import { expect } from 'chai';
import { existsSync, readFileSync } from 'fs';
import { WebpackPluginConfig } from '../src/Config';
import WebpackConfigGenerator from '../src/WebpackConfig';

async function asyncWebpack(config: Configuration): Promise<void> {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) {
        reject(err);
        return;
      }

      if (stats?.compilation?.errors?.length) {
        reject(stats.compilation.errors);
        return;
      }

      if (stats?.compilation?.warnings?.length) {
        reject(stats.compilation.warnings);
        return;
      }

      resolve();
    });
  });
}

describe('AssetRelocatorPatch', () => {
  const appPath = join(__dirname, 'fixtures', 'apps', 'native-modules');

  const config = {
    mainConfig: './webpack.main.config.js',
    renderer: {
      config: './webpack.renderer.config.js',
      entryPoints: [
        {
          name: 'main_window',
          js: join(appPath, 'src/renderer.js'),
          preload: {
            js: join(appPath, 'src/preload.js'),
          },
        },
      ],
    },
  } as WebpackPluginConfig;

  describe('Development', () => {
    const generator = new WebpackConfigGenerator(config, appPath, false, 3000);

    it('builds main', async () => {
      const mainConfig = generator.getMainConfig();
      await asyncWebpack(mainConfig);

      expect(existsSync(join(appPath, '.webpack/main/native_modules/build/Release/hello_world.node'))).to.equal(true);

      const mainJs = readFileSync(join(appPath, '.webpack/main/index.js'), { encoding: 'utf8' });
      expect(mainJs).to.contain('__webpack_require__.ab = __dirname + "/native_modules/"');
      expect(mainJs).to.contain('require(__webpack_require__.ab + "build/Release/hello_world.node")');
    });

    it('builds preload', async () => {
      const entryPoint = config.renderer.entryPoints[0];
      const preloadConfig = await generator.getPreloadRendererConfig(
        entryPoint, entryPoint.preload!,
      );
      await asyncWebpack(preloadConfig);

      expect(existsSync(join(appPath, '.webpack/renderer/main_window/native_modules/build/Release/hello_world.node'))).to.equal(true);

      const preloadJs = readFileSync(join(appPath, '.webpack/renderer/main_window/preload.js'), { encoding: 'utf8' });
      expect(preloadJs).to.contain('__webpack_require__.ab = __dirname + "/native_modules/"');
      expect(preloadJs).to.contain('require(__webpack_require__.ab + \\"build/Release/hello_world.node\\")');
    });

    it('builds renderer', async () => {
      const rendererConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      await asyncWebpack(rendererConfig);

      expect(existsSync(join(appPath, '.webpack/renderer/native_modules/build/Release/hello_world.node'))).to.equal(true);

      const rendererJs = readFileSync(join(appPath, '.webpack/renderer/main_window/index.js'), { encoding: 'utf8' });
      const expectedPath = resolvePath(join(appPath, '.webpack/renderer'));
      expect(rendererJs).to.contain(`__webpack_require__.ab = ${JSON.stringify(expectedPath)} + "/native_modules/"`);
      expect(rendererJs).to.contain('require(__webpack_require__.ab + \\"build/Release/hello_world.node\\")');
    });
  });

  describe('Production', () => {
    const generator = new WebpackConfigGenerator(config, appPath, true, 3000);

    it('builds main', async () => {
      const mainConfig = generator.getMainConfig();
      await asyncWebpack(mainConfig);

      expect(existsSync(join(appPath, '.webpack/main/native_modules/build/Release/hello_world.node'))).to.equal(true);

      const mainJs = readFileSync(join(appPath, '.webpack/main/index.js'), { encoding: 'utf8' });
      expect(mainJs).to.contain('o.ab=__dirname+"/native_modules/"');
      expect(mainJs).to.contain('require(o.ab+"build/Release/hello_world.node")');
    });

    it('builds preload', async () => {
      const entryPoint = config.renderer.entryPoints[0];
      const preloadConfig = await generator.getPreloadRendererConfig(
        entryPoint, entryPoint.preload!,
      );
      await asyncWebpack(preloadConfig);

      expect(existsSync(join(appPath, '.webpack/renderer/main_window/native_modules/build/Release/hello_world.node'))).to.equal(true);

      const preloadJs = readFileSync(join(appPath, '.webpack/renderer/main_window/preload.js'), { encoding: 'utf8' });
      expect(preloadJs).to.contain('o.ab=__dirname+"/native_modules/"');
      expect(preloadJs).to.contain('require(o.ab+"build/Release/hello_world.node")');
    });

    it('builds renderer', async () => {
      const rendererConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      await asyncWebpack(rendererConfig);

      expect(existsSync(join(appPath, '.webpack/renderer/native_modules/build/Release/hello_world.node'))).to.equal(true);

      const rendererJs = readFileSync(join(appPath, '.webpack/renderer/main_window/index.js'), { encoding: 'utf8' });
      expect(rendererJs).to.contain('o.ab=require("path").resolve(require("path").dirname(__filename),"..")+"/native_modules/"');
      expect(rendererJs).to.contain('require(o.ab+"build/Release/hello_world.node")');
    });
  });
});
