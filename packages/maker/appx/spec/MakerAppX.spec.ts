import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDefaultCertificate } from '../src/MakerAppX';

describe.runIf(process.platform === 'win32')('MakerAppX', function () {
  describe('createDefaultCertificate', () => {
    let tmpDir: string;

    beforeAll(async () => {
      const tmp = os.tmpdir();
      const tmpdir = path.join(tmp, 'electron-forge-test-');
      tmpDir = await fs.mkdtemp(tmpdir);
    });

    afterAll(async () => {
      await fs.rm(tmpDir, { recursive: true });
    });

    const def = process.platform === 'win32' ? it : it.skip;

    def('should create a .pfx file', async () => {
      await fs.copyFile(
        path.join(
          __dirname,
          '../../../api/core/spec/fixture',
          'bogus-private-key.pvk',
        ),
        path.join(tmpDir, 'dummy.pvk'),
      );
      const outputCertPath = await createDefaultCertificate('CN=Test', {
        certFilePath: tmpDir,
        certFileName: 'dummy',
        install: false,
      });

      const fileContents = await fs.readFile(outputCertPath);
      expect(fileContents).toBeInstanceOf(Buffer);
      expect(fileContents.length).toBeGreaterThan(0);
    });
  });
});
