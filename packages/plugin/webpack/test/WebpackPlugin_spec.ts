import { expect } from 'chai';
import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';

import WebpackPlugin from '../src/WebpackPlugin';

describe('WebpackPlugin', () => {
  const webpackTestDir = path.resolve(tmpdir(), 'electron-forge-plugin-webpack-test');

  describe('PRELOAD_WEBPACK_ENTRY', () => {
    it('should assign absolute preload script path in development', () => {
      const p = new WebpackPlugin({
        mainConfig: {},
        renderer: {
          config: {},
          entryPoints: [
            {
              js: 'window.js',
              name: 'window',
              preload: {
                js: 'preload.js',
              },
            },
          ],
        },
      });
      p.init(process.platform === 'win32' ? 'C:\\baseDir' : '/baseDir');
      const defines = p.getDefines();

      if (process.platform === 'win32') {
        expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).to.be.eq(String.raw`'C:\\baseDir\\.webpack\\renderer\\window\\preload.js'`);
      } else {
        expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).to.be.eq("'/baseDir/.webpack/renderer/window/preload.js'");
      }
    });

    it('should assign an expression to resolve the preload script in production', () => {
      const p = new WebpackPlugin({
        mainConfig: {},
        renderer: {
          config: {},
          entryPoints: [
            {
              js: 'window.js',
              name: 'window',
              preload: {
                js: 'preload.js',
              },
            },
          ],
        },
      });
      p.init(process.platform === 'win32' ? 'C:\\baseDir' : '/baseDir');
      (p as any).isProd = true;
      const defines = p.getDefines();
      expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).to.be.eq("require('path').resolve(__dirname, '../renderer', 'window', 'preload.js')");
    });
  });

  describe('packageAfterCopy', () => {
    const packageJSONPath = path.join(webpackTestDir, 'package.json');
    const packagedPath = path.join(webpackTestDir, 'packaged');
    const packagedPackageJSONPath = path.join(packagedPath, 'package.json');
    let plugin: WebpackPlugin;

    before(async () => {
      await fs.ensureDir(packagedPath);
      plugin = new WebpackPlugin({
        mainConfig: {},
        renderer: {
          config: {},
          entryPoints: [],
        },
      });
      plugin.setDirectories(webpackTestDir);
    });

    it('should remove config.forge from package.json', async () => {
      const packageJSON = { config: { forge: 'config.js' } };
      await fs.writeJson(packageJSONPath, packageJSON);
      await plugin.packageAfterCopy(null, packagedPath);
      expect(await fs.pathExists(packagedPackageJSONPath)).to.equal(true);
      expect((await fs.readJson(packagedPackageJSONPath)).config).to.not.have.property('forge');
    });

    it('should succeed if there is no config.forge', async () => {
      const packageJSON = { name: 'test' };
      await fs.writeJson(packageJSONPath, packageJSON);
      await plugin.packageAfterCopy(null, packagedPath);
      expect(await fs.pathExists(packagedPackageJSONPath)).to.equal(true);
      expect((await fs.readJson(packagedPackageJSONPath))).to.not.have.property('config');
    });

    after(async () => {
      await fs.remove(webpackTestDir);
    });
  });
});
