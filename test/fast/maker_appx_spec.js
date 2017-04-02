import { tmpdir } from 'os';
import { join } from 'path';
import { copy, ensureDir, readFile, remove } from 'fs-promise';
import { expect } from 'chai';

import { getDistinguishedNameFromAuthor, createDefaultCertificate } from '../../src/makers/win32/appx.js';

describe('appx maker', () => {
  describe('createDefaultCertificate', () => {
    const tmpDir = join(tmpdir(), `electron-forge-maker-appx-test-${Date.now()}`);

    before(async () => {
      await ensureDir(tmpDir);
    });

    after(async () => {
      await remove(tmpDir);
    });

    if (process.platform === 'win32') {
      it('should create a .pfx file', async () => {
        await copy(join(__dirname, '..', '..', 'node_modules',
          'electron-windows-store', 'test', 'lib', 'bogus-private-key.pvk'),
          join(tmpDir, 'dummy.pvk'));
        const outputCertPath = await createDefaultCertificate('CN=Test', {
          certFilePath: tmpDir,
          certFileName: 'dummy',
          install: false,
        });

        const fileContents = await readFile(outputCertPath);
        expect(fileContents).to.be.an.instanceof(Buffer);
        expect(fileContents.length).to.be.above(0);
      });
    }
  });

  describe('getDistinguishedNameFromAuthor', () => {
    [{
      author: 'First Last',
      expectedReturnValue: 'CN=First Last',
    }, {
      author: 'First Last <first.last@example.com>',
      expectedReturnValue: 'CN=First Last',
    }, {
      author: {
        name: 'First Last',
      },
      expectedReturnValue: 'CN=First Last',
    }, {
      author: undefined,
      expectedReturnValue: 'CN=',
    }, {
      author: '',
      expectedReturnValue: 'CN=',
    }].forEach((scenario) => {
      it(`${JSON.stringify(scenario.author)} -> "${scenario.expectedReturnValue}"`, () => {
        expect(getDistinguishedNameFromAuthor(scenario.author)).to.equal(scenario.expectedReturnValue);
      });
    });
  });
});
