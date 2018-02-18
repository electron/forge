import { expect } from 'chai';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { ensureDirectory, ensureFile } from '../../src/util/ensure-output';

describe('ensure-output', () => {
  const tmpPath = path.resolve(os.tmpdir(), 'forge-ensure');

  before(async () => {
    await fs.mkdirs(tmpPath);
  });

  describe('ensureDirectory', () => {
    it('should delete the directory contents if it exists', async () => {
      await fs.mkdirs(path.resolve(tmpPath, 'foo'));
      fs.writeFileSync(path.resolve(tmpPath, 'foo', 'touchedFile'));
      expect(await fs.pathExists(path.resolve(tmpPath, 'foo', 'touchedFile'))).to.equal(true);
      await ensureDirectory(path.resolve(tmpPath, 'foo'));
      expect(await fs.pathExists(path.resolve(tmpPath, 'foo', 'touchedFile'))).to.equal(false);
    });

    it('should create the directory if it does not exist', async () => {
      expect(await fs.pathExists(path.resolve(tmpPath, 'bar'))).to.equal(false);
      await ensureDirectory(path.resolve(tmpPath, 'bar'));
      expect(await fs.pathExists(path.resolve(tmpPath, 'bar'))).to.equal(true);
    });
  });

  describe('ensureFile', () => {
    it('should delete the file if it exists', async () => {
      await fs.mkdirs(path.resolve(tmpPath, 'foo'));
      fs.writeFileSync(path.resolve(tmpPath, 'foo', 'touchedFile'));
      expect(await fs.pathExists(path.resolve(tmpPath, 'foo', 'touchedFile'))).to.equal(true);
      await ensureFile(path.resolve(tmpPath, 'foo'));
      expect(await fs.pathExists(path.resolve(tmpPath, 'foo', 'touchedFile'))).to.equal(false);
    });

    it('should create the containing directory if it does not exist', async () => {
      expect(await fs.pathExists(path.resolve(tmpPath, 'bar'))).to.equal(false);
      await ensureFile(path.resolve(tmpPath, 'bar', 'file'));
      expect(await fs.pathExists(path.resolve(tmpPath, 'bar'))).to.equal(true);
    });
  });

  afterEach(async () => {
    await fs.remove(tmpPath);
  });
});
