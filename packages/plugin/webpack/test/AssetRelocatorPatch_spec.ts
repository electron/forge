import http from 'http';
import path from 'path';

import { spawn } from '@malept/cross-spawn-promise';
import { expect } from 'chai';
import { pathExists, readFile } from 'fs-extra';
import { Configuration, webpack } from 'webpack';
import which from 'which';

import { WebpackPluginConfig, WebpackPluginEntryPointLocalWindow } from '../src/Config';
import WebpackConfigGenerator from '../src/WebpackConfig';

type Closeable = {
  close: () => void;
};

let servers: Closeable[] = [];

const nativePathSuffix = 'build/Release/hello_world.node';
const appPath = path.join(__dirname, 'fixtures', 'apps', 'native-modules');
const pmCmd = process.platform === 'win32' ? which.sync('npm.cmd') : 'npm';

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

/**
 * Webpack dev server doesn't like to exit, outputs logs  so instead we just create a
 * basic server.
 */
function createSimpleDevServer(rendererOut: string): http.Server {
  return http
    .createServer(async (req, res) => {
      const url = req.url || '';
      const file = url.endsWith('main_window') ? path.join(url, '/index.html') : url;
      const fullPath = path.join(rendererOut, file);
      try {
        const data = await readFile(fullPath);
        res.writeHead(200);
        res.end(data);
      } catch (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
      }
    })
    .listen(3000);
}

type ExpectNativeModulePathOptions = {
  outDir: string;
  jsPath: string;
  nativeModulesString: string;
  nativePathString: string;
};

async function expectOutputFileToHaveTheCorrectNativeModulePath({
  outDir,
  jsPath,
  nativeModulesString,
  nativePathString,
}: ExpectNativeModulePathOptions): Promise<void> {
  const nativePath = `native_modules/${nativePathSuffix}`;
  expect(await pathExists(path.join(outDir, nativePath))).to.equal(true);

  const jsContents = await readFile(jsPath, { encoding: 'utf8' });
  expect(jsContents).to.contain(nativeModulesString);
  expect(jsContents).to.contain(nativePathString);
}

async function yarnStart(): Promise<string> {
  return spawn(pmCmd, ['start'], {
    cwd: appPath,
    shell: true,
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: 'true',
    },
  });
}

describe('AssetRelocatorPatch', () => {
  const rendererOut = path.join(appPath, '.webpack/renderer');
  const mainOut = path.join(appPath, '.webpack/main');

  before(async () => {
    await spawn(pmCmd, ['install'], { cwd: appPath, shell: true });
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
      nodeIntegration: true,
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
      await asyncWebpack(await generator.getMainConfig());

      await expectOutputFileToHaveTheCorrectNativeModulePath({
        outDir: mainOut,
        jsPath: path.join(mainOut, 'index.js'),
        nativeModulesString: '__webpack_require__.ab = __dirname + "/native_modules/"',
        nativePathString: `require(__webpack_require__.ab + "${nativePathSuffix}")`,
      });
    });

    it('builds preload', async () => {
      const entryPoint = config.renderer.entryPoints[0] as WebpackPluginEntryPointLocalWindow;
      const preloadConfig = await generator.getPreloadConfigForEntryPoint(entryPoint);
      await asyncWebpack(preloadConfig);

      await expectOutputFileToHaveTheCorrectNativeModulePath({
        outDir: path.join(rendererOut, 'main_window'),
        jsPath: path.join(rendererOut, 'main_window/preload.js'),
        nativeModulesString: '__webpack_require__.ab = __dirname + "/native_modules/"',
        nativePathString: `require(__webpack_require__.ab + \\"${nativePathSuffix}\\")`,
      });
    });

    it('builds renderer', async () => {
      const rendererConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      for (const rendererEntryConfig of rendererConfig) {
        await asyncWebpack(rendererEntryConfig);
      }

      await expectOutputFileToHaveTheCorrectNativeModulePath({
        outDir: rendererOut,
        jsPath: path.join(rendererOut, 'main_window/index.js'),
        nativeModulesString: `__webpack_require__.ab = ${JSON.stringify(rendererOut)} + "/native_modules/"`,
        nativePathString: `require(__webpack_require__.ab + \\"${nativePathSuffix}\\")`,
      });
    });

    it('runs the app with the native module', async () => {
      servers.push(createSimpleDevServer(rendererOut));

      const output = await yarnStart();

      expect(output).to.contain('Hello, world! from the main');
      expect(output).to.contain('Hello, world! from the preload');
      expect(output).to.contain('Hello, world! from the renderer');
    });
  });

  describe('Production', () => {
    let generator = new WebpackConfigGenerator(config, appPath, true, 3000);

    it('builds main', async () => {
      const mainConfig = await generator.getMainConfig();
      await asyncWebpack(mainConfig);

      await expectOutputFileToHaveTheCorrectNativeModulePath({
        outDir: mainOut,
        jsPath: path.join(mainOut, 'index.js'),
        nativeModulesString: '.ab=__dirname+"/native_modules/"',
        nativePathString: `.ab+"${nativePathSuffix}"`,
      });
    });

    it('builds preload', async () => {
      const entryPoint = config.renderer.entryPoints[0] as WebpackPluginEntryPointLocalWindow;
      const preloadConfig = await generator.getPreloadConfigForEntryPoint(entryPoint);
      await asyncWebpack(preloadConfig);

      await expectOutputFileToHaveTheCorrectNativeModulePath({
        outDir: path.join(rendererOut, 'main_window'),
        jsPath: path.join(rendererOut, 'main_window/preload.js'),
        nativeModulesString: '.ab=__dirname+"/native_modules/"',
        nativePathString: `.ab+"${nativePathSuffix}"`,
      });
    });

    it('builds renderer', async () => {
      const rendererConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      for (const rendererEntryConfig of rendererConfig) {
        await asyncWebpack(rendererEntryConfig);
      }

      await expectOutputFileToHaveTheCorrectNativeModulePath({
        outDir: rendererOut,
        jsPath: path.join(rendererOut, 'main_window/index.js'),
        nativeModulesString: '.ab=require("path").resolve(require("path").dirname(__filename),"..")+"/native_modules/"',
        nativePathString: `.ab+"${nativePathSuffix}"`,
      });
    });

    it('runs the app with the native module', async () => {
      const output = await yarnStart();

      expect(output).to.contain('Hello, world! from the main');
      expect(output).to.contain('Hello, world! from the preload');
      expect(output).to.contain('Hello, world! from the renderer');
    });

    it('builds renderer with nodeIntegration = false', async () => {
      config.renderer.nodeIntegration = false;
      generator = new WebpackConfigGenerator(config, appPath, true, 3000);

      const rendererConfig = await generator.getRendererConfig(config.renderer.entryPoints);
      for (const rendererEntryConfig of rendererConfig) {
        await asyncWebpack(rendererEntryConfig);
      }

      await expectOutputFileToHaveTheCorrectNativeModulePath({
        outDir: rendererOut,
        jsPath: path.join(rendererOut, 'main_window/index.js'),
        nativeModulesString: '.ab="/native_modules/"',
        nativePathString: `.ab+"${nativePathSuffix}"`,
      });
    });
  });
});
