import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EmptyConfig, MakerBase } from '../src/Maker';

class MakerImpl extends MakerBase<EmptyConfig> {
  name = 'test';

  defaultPlatforms = [];
}

const maker = new MakerImpl({}, []);
let tmpDir: string;

describe('ensure-output', () => {
  beforeEach(async () => {
    const tmp = os.tmpdir();
    const tmpdir = path.join(tmp, 'electron-forge-test-');
    tmpDir = await fs.promises.mkdtemp(tmpdir);
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true });
  });

  describe('ensureDirectory', () => {
    it('should delete the directory contents if it exists', async () => {
      fs.mkdirSync(path.resolve(tmpDir, 'foo'));
      fs.writeFileSync(path.resolve(tmpDir, 'foo', 'touchedFile'), '');
      expect(fs.existsSync(path.resolve(tmpDir, 'foo', 'touchedFile'))).toEqual(
        true,
      );

      await maker.ensureDirectory(path.resolve(tmpDir, 'foo'));

      expect(fs.existsSync(path.resolve(tmpDir, 'foo', 'touchedFile'))).toEqual(
        false,
      );
    });

    it('should create the directory if it does not exist', async () => {
      expect(fs.existsSync(path.resolve(tmpDir, 'bar'))).toEqual(false);
      await maker.ensureDirectory(path.resolve(tmpDir, 'bar'));
      expect(fs.existsSync(path.resolve(tmpDir, 'bar'))).toEqual(true);
    });
  });

  describe('ensureFile', () => {
    it('should delete the file if it exists', async () => {
      fs.mkdirSync(path.resolve(tmpDir, 'foo'));
      fs.writeFileSync(path.resolve(tmpDir, 'foo', 'touchedFile'), '');
      expect(fs.existsSync(path.resolve(tmpDir, 'foo', 'touchedFile'))).toEqual(
        true,
      );

      await maker.ensureFile(path.resolve(tmpDir, 'foo'));

      expect(fs.existsSync(path.resolve(tmpDir, 'foo', 'touchedFile'))).toEqual(
        false,
      );
    });

    it('should create the containing directory if it does not exist', async () => {
      expect(fs.existsSync(path.resolve(tmpDir, 'bar'))).toEqual(false);

      await maker.ensureFile(path.resolve(tmpDir, 'bar', 'file'));

      expect(fs.existsSync(path.resolve(tmpDir, 'bar'))).toEqual(true);
    });
  });
});
