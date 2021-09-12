import { tmpdir } from 'os';
import { join } from 'path';
import fs from 'fs-extra';
import { expect } from 'chai';

import { createDefaultCertificate } from '../src/MakerAppX';

describe('MakerApPX', () => {
  describe('createDefaultCertificate', () => {
    const tmpDir = join(tmpdir(), `electron-forge-maker-appx-test-${Date.now()}`);

    before(async () => {
      await fs.ensureDir(tmpDir);
    });

    after(async () => {
      await fs.remove(tmpDir);
    });

    const def = process.platform === 'win32' ? it : it.skip;

    def('should create a .pfx file', async () => {
      await fs.copy(
        join(__dirname, '../../../api/core/test/fixture', 'bogus-private-key.pvk'),
        join(tmpDir, 'dummy.pvk'),
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
  });
});
