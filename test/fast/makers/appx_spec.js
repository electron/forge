import { tmpdir } from 'os';
import { join } from 'path';
import fs from 'fs-extra';
import { expect } from 'chai';

import { createDefaultCertificate } from '../../../src/makers/win32/appx';

describe('appx maker', () => {
  describe('createDefaultCertificate', () => {
    const tmpDir = join(tmpdir(), `electron-forge-maker-appx-test-${Date.now()}`);

    before(async () => {
      await fs.ensureDir(tmpDir);
    });

    after(async () => {
      await fs.remove(tmpDir);
    });

    if (process.platform === 'win32') {
      it('should create a .pfx file', async () => {
        await fs.copy(
          join(__dirname, '..', '..', 'fixture', 'bogus-private-key.pvk'),
          join(tmpDir, 'dummy.pvk')
        );
        const outputCertPath = await createDefaultCertificate('CN=Test', {
          certFilePath: tmpDir,
          certFileName: 'dummy',
          install: false,
        });

        const fileContents = await fs.readFile(outputCertPath);
        expect(fileContents).to.be.an.instanceof(Buffer);
        expect(fileContents.length).to.be.above(0);
      });
    }
  });
});
