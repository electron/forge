import { Configuration, webpack } from 'webpack';
import { join } from 'path';
import { expect } from 'chai';
import http from 'http';
import { existsSync, readFile, readFileSync } from 'fs';
import { spawn } from '@malept/cross-spawn-promise';
import { WebpackPluginConfig } from '../src/Config';
import WebpackConfigGenerator from '../src/WebpackConfig';

let servers: {close():void}[] = [];

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
  const rendererOut = join(appPath, '.webpack/renderer');
  const mainOut = join(appPath, '.webpack/main');
  const nativePath = 'native_modules/build/Release/hello_world.node';

  before(async () => {
    await spawn('yarn', [], { cwd: appPath, shell: true });
  });

  after(() => {
    for (const server of servers) {
      server.close();
    }
    servers = [];
  });

  const config = {
    mainConfig: './webpack.main.config.js',
    renderer: {
      config: './webpack.renderer.config.js',
      entryPoints: [
        {
          name: 'main_window',
          html: './src/index.html',
          js: './src/renderer.js',
          preload: {
            js: './src/preload.js',
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

      expect(existsSync(join(mainOut, nativePath))).to.equal(true);

      const mainJs = readFileSync(join(mainOut, 'index.js'), { encoding: 'utf8' });
      expect(mainJs).to.contain('__webpack_require__.ab = __dirname + "/native_modules/"');
      expect(mainJs).to.contain('require(__webpack_require__.ab + "build/Release/hello_world.node")');
    });

    it('builds preload', async () => {
      const entryPoint = config.renderer.entryPoints[0];
      const preloadConfig = await generator.getPreloadRendererConfig(
        entryPoint, entryPoint.preload!,
      );
      await asyncWebpack(preloadConfig);

      expect(existsSync(join(rendererOut, 'main_window', nativePath))).to.equal(true);

      const preloadJs = readFileSync(join(rendererOut, 'main_window/preload.js'), { encoding: 'utf8' });
      expect(preloadJs).to.contain('__webpack_require__.ab = __dirname + "/native_modules/"');
      expect(preloadJs).to.contain('require(__webpack_require__.ab + \\"build/Release/hello_world.node\\")');
    });

    it('builds renderer', async () => {
      const rendererConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      await asyncWebpack(rendererConfig);

      expect(existsSync(join(rendererOut, nativePath))).to.equal(true);

      const rendererJs = readFileSync(join(rendererOut, 'main_window/index.js'), { encoding: 'utf8' });
      expect(rendererJs).to.contain(`__webpack_require__.ab = ${JSON.stringify(rendererOut)} + "/native_modules/"`);
      expect(rendererJs).to.contain('require(__webpack_require__.ab + \\"build/Release/hello_world.node\\")');
    });

    it('app runs with expected output', async () => {
      // Webpack dev server doesn't like to exit, outputs logs  so instead we just create a
      // basic server
      const server = http.createServer((req, res) => {
        const url = (req.url || '');
        const file = url.endsWith('main_window') ? join(url, '/index.html') : url;
        const path = join(rendererOut, file);
        readFile(path, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
          }
          res.writeHead(200);
          res.end(data);
        });
      }).listen(3000);

      servers.push(server);

      const output = await spawn('yarn start', [], {
        cwd: appPath,
        shell: true,
        env: {
          ELECTRON_ENABLE_LOGGING: 'true',
        },
      });

      expect(output).to.contain('Hello, world! from the main');
      expect(output).to.contain('Hello, world! from the preload');
      expect(output).to.contain('Hello, world! from the renderer');
    });
  });

  describe('Production', () => {
    const generator = new WebpackConfigGenerator(config, appPath, true, 3000);

    it('builds main', async () => {
      const mainConfig = generator.getMainConfig();
      await asyncWebpack(mainConfig);

      expect(existsSync(join(mainOut, nativePath))).to.equal(true);

      const mainJs = readFileSync(join(mainOut, 'index.js'), { encoding: 'utf8' });
      expect(mainJs).to.contain('.ab=__dirname+"/native_modules/"');
      expect(mainJs).to.contain('.ab+"build/Release/hello_world.node"');
    });

    it('builds preload', async () => {
      const entryPoint = config.renderer.entryPoints[0];
      const preloadConfig = await generator.getPreloadRendererConfig(
        entryPoint, entryPoint.preload!,
      );
      await asyncWebpack(preloadConfig);

      expect(existsSync(join(rendererOut, 'main_window', nativePath))).to.equal(true);

      const preloadJs = readFileSync(join(rendererOut, 'main_window/preload.js'), { encoding: 'utf8' });
      expect(preloadJs).to.contain('.ab=__dirname+"/native_modules/"');
      expect(preloadJs).to.contain('.ab+"build/Release/hello_world.node"');
    });

    it('builds renderer', async () => {
      const rendererConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      await asyncWebpack(rendererConfig);

      expect(existsSync(join(rendererOut, nativePath))).to.equal(true);

      const rendererJs = readFileSync(join(rendererOut, 'main_window/index.js'), { encoding: 'utf8' });
      expect(rendererJs).to.contain('.ab=require("path").resolve(require("path").dirname(__filename),"..")+"/native_modules/"');
      expect(rendererJs).to.contain('.ab+"build/Release/hello_world.node"');
    });

    it('app runs with expected output', async () => {
      const output = await spawn('yarn start', [], {
        cwd: appPath,
        shell: true,
        env: {
          ELECTRON_ENABLE_LOGGING: 'true',
        },
      });

      expect(output).to.contain('Hello, world! from the main');
      expect(output).to.contain('Hello, world! from the preload');
      expect(output).to.contain('Hello, world! from the renderer');
    });
  });
});
