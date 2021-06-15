import { Configuration, webpack } from 'webpack';
import { join, resolve as resolvePath } from 'path';
import { expect } from 'chai';
import http from 'http';
import { existsSync, readFile, readFileSync } from 'fs';
import { spawnSync, spawn, SpawnOptions } from 'child_process';
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

function spawnAsync(command: string, opt: SpawnOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    const child = spawn(command, [], opt);
    child.on('error', (e) => reject(e));
    child?.stdout?.on('data', (chunk) => { stdout += chunk; });
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(code);
      } else {
        resolve(stdout);
      }
    });
  });
}

describe('AssetRelocatorPatch', () => {
  const appPath = join(__dirname, 'fixtures', 'apps', 'native-modules');

  before(() => {
    spawnSync('yarn', { cwd: appPath, shell: true });
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

    it('app runs with expected output', async () => {
      // Webpack dev server doesn't like to exit so instead we just create a
      // basic server
      const server = http.createServer((req, res) => {
        const url = (req.url || '');
        const file = url.endsWith('main_window') ? join(url, '/index.html') : url;
        const path = join(appPath, '.webpack/renderer', file);
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

      const output = await spawnAsync('yarn start', {
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

      expect(existsSync(join(appPath, '.webpack/main/native_modules/build/Release/hello_world.node'))).to.equal(true);

      const mainJs = readFileSync(join(appPath, '.webpack/main/index.js'), { encoding: 'utf8' });
      expect(mainJs).to.contain('.ab=__dirname+"/native_modules/"');
      expect(mainJs).to.contain('.ab+"build/Release/hello_world.node"');
    });

    it('builds preload', async () => {
      const entryPoint = config.renderer.entryPoints[0];
      const preloadConfig = await generator.getPreloadRendererConfig(
        entryPoint, entryPoint.preload!,
      );
      await asyncWebpack(preloadConfig);

      expect(existsSync(join(appPath, '.webpack/renderer/main_window/native_modules/build/Release/hello_world.node'))).to.equal(true);

      const preloadJs = readFileSync(join(appPath, '.webpack/renderer/main_window/preload.js'), { encoding: 'utf8' });
      expect(preloadJs).to.contain('.ab=__dirname+"/native_modules/"');
      expect(preloadJs).to.contain('.ab+"build/Release/hello_world.node"');
    });

    it('builds renderer', async () => {
      const rendererConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      await asyncWebpack(rendererConfig);

      expect(existsSync(join(appPath, '.webpack/renderer/native_modules/build/Release/hello_world.node'))).to.equal(true);

      const rendererJs = readFileSync(join(appPath, '.webpack/renderer/main_window/index.js'), { encoding: 'utf8' });
      expect(rendererJs).to.contain('.ab=require("path").resolve(require("path").dirname(__filename),"..")+"/native_modules/"');
      expect(rendererJs).to.contain('.ab+"build/Release/hello_world.node"');
    });

    it('app runs with expected output', async () => {
      const result = spawnSync('yarn start', {
        cwd: appPath,
        shell: true,
        encoding: 'utf-8',
        env: {
          ...process.env, ELECTRON_ENABLE_LOGGING: 'true',
        },
      });

      const output = result.stdout;

      expect(output).to.contain('Hello, world! from the main');
      expect(output).to.contain('Hello, world! from the preload');
      expect(output).to.contain('Hello, world! from the renderer');
    });
  });
});
