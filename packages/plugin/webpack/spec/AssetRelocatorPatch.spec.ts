import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

import { spawn } from '@malept/cross-spawn-promise';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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
const pmCmd = process.platform === 'win32' ? `"${which.sync('npm.cmd')}"` : 'npm';

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
        const data = await fs.promises.readFile(fullPath, 'utf-8');
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
  expect(fs.existsSync(path.join(outDir, nativePath))).toEqual(true);

  const jsContents = await fs.promises.readFile(jsPath, { encoding: 'utf8' });
  expect(jsContents).toEqual(expect.stringContaining(nativeModulesString));
  expect(jsContents).toEqual(expect.stringContaining(nativePathString));
}

async function runApp(): Promise<string> {
  const env = {
    ...process.env,
    ELECTRON_ENABLE_LOGGING: '1',
    ELECTRON_RUN_AS_NODE: undefined, // This will make the test fail if turned on
  };

  return spawn(pmCmd, ['start'], {
    cwd: appPath,
    shell: true,
    env,
    stdio: 'pipe',
  });
}

const safeFirstRendererConfig = (renderer: WebpackPluginConfig['renderer']) => {
  if (Array.isArray(renderer)) return renderer[0];
  return renderer;
};

describe('AssetRelocatorPatch', () => {
  const rendererOut = path.join(appPath, '.webpack/renderer');
  const mainOut = path.join(appPath, '.webpack/main');

  beforeAll(async () => {
    await spawn(pmCmd, ['install'], { cwd: appPath, shell: true });
  }, 60_000);

  afterAll(() => {
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
      const preloadConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
      await asyncWebpack(preloadConfig[0]);

      await expectOutputFileToHaveTheCorrectNativeModulePath({
        outDir: rendererOut,
        jsPath: path.join(rendererOut, 'main_window/preload.js'),
        nativeModulesString: `__webpack_require__.ab = ${JSON.stringify(rendererOut)} + "/native_modules/"`,
        nativePathString: `require(__webpack_require__.ab + \\"${nativePathSuffix}\\")`,
      });
    });

    it('builds renderer', async () => {
      const rendererConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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

    it('runs the app with the native module', { timeout: 15_000 }, async () => {
      servers.push(createSimpleDevServer(rendererOut));

      const output = await runApp();

      expect(output).toEqual(expect.stringContaining('Hello, world! from the main'));
      expect(output).toEqual(expect.stringContaining('Hello, world! from the preload'));
      expect(output).toEqual(expect.stringContaining('Hello, world! from the renderer'));
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
      const entryPoint = safeFirstRendererConfig(config.renderer).entryPoints[0] as WebpackPluginEntryPointLocalWindow;
      const preloadConfig = await generator.getRendererConfig({
        ...safeFirstRendererConfig(config.renderer),
        entryPoints: [entryPoint],
      });
      await asyncWebpack(preloadConfig[0]);

      await expectOutputFileToHaveTheCorrectNativeModulePath({
        outDir: rendererOut,
        jsPath: path.join(rendererOut, 'main_window/preload.js'),
        nativeModulesString: '.ab=require("path").resolve(__dirname,"..")+"/native_modules/"',
        nativePathString: `.ab+"${nativePathSuffix}"`,
      });
    });

    it('builds renderer', async () => {
      const rendererConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
      for (const rendererEntryConfig of rendererConfig) {
        await asyncWebpack(rendererEntryConfig);
      }

      await expectOutputFileToHaveTheCorrectNativeModulePath({
        outDir: rendererOut,
        jsPath: path.join(rendererOut, 'main_window/index.js'),
        nativeModulesString: '.ab=require("path").resolve(__dirname,"..")+"/native_modules/"',
        nativePathString: `.ab+"${nativePathSuffix}"`,
      });
    });

    it('runs the app with the native module', async () => {
      const output = await runApp();

      expect(output).toEqual(expect.stringContaining('Hello, world! from the main'));
      expect(output).toEqual(expect.stringContaining('Hello, world! from the preload'));
      expect(output).toEqual(expect.stringContaining('Hello, world! from the renderer'));
    });

    it('builds renderer with nodeIntegration = false', async () => {
      safeFirstRendererConfig(config.renderer).nodeIntegration = false;
      generator = new WebpackConfigGenerator(config, appPath, true, 3000);

      const rendererConfig = await generator.getRendererConfig(safeFirstRendererConfig(config.renderer));
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
