import { expect } from 'chai';

import WebpackConfigGenerator from '../src/WebpackConfig';

describe('WebpackConfigGenerator', () => {
  describe('PRELOAD_WEBPACK_ENTRY', () => {
    const config = {
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
    };
    const projectDir = process.platform === 'win32' ? 'C:\\baseDir' : '/baseDir';

    it('should assign absolute preload script path in development', () => {
      const generator = new WebpackConfigGenerator(config, projectDir, false, 3000);
      const defines = generator.getDefines();

      if (process.platform === 'win32') {
        expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).to.equal(String.raw`'C:\\baseDir\\.webpack\\renderer\\window\\preload.js'`);
      } else {
        expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).to.equal("'/baseDir/.webpack/renderer/window/preload.js'");
      }
    });

    it('should assign an expression to resolve the preload script in production', () => {
      const generator = new WebpackConfigGenerator(config, projectDir, true, 3000);
      const defines = generator.getDefines();
      expect(defines.WINDOW_PRELOAD_WEBPACK_ENTRY).to.equal("require('path').resolve(__dirname, '../renderer', 'window', 'preload.js')");
    });
  });
});
