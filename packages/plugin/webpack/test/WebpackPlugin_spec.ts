import { expect } from 'chai';

import WebpackPlugin from '../src/WebpackPlugin';

describe('WebpackPlugin', () => {
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
});
