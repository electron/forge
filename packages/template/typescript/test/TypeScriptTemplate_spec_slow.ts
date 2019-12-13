import { api, testUtils } from '@electron-forge/core';
import { expect } from 'chai';
import fs from 'fs-extra';
import path from 'path';

describe('init', () => {
  let dir: string;

  before(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
  });

  it('should succeed in initializing the typescript template', async () => {
    await api.init({
      dir,
      template: 'typescript',
    });
  });

  it('should copy the appropriate template files', async () => {
    const expectedFiles = [
      'tsconfig.json',
      'tslint.json',
    ];
    for (const filename of expectedFiles) {
      await testUtils.expectProjectPathExists(dir, filename, 'file');
    }
  });

  it('should convert the main process file to typescript', async () => {
    await testUtils.expectProjectPathNotExists(dir, path.join('src', 'index.js'), 'file');
    await testUtils.expectProjectPathExists(dir, path.join('src', 'index.ts'), 'file');
    expect((await fs.readFile(path.join(dir, 'src', 'index.ts'))).toString()).to.match(/Electron.BrowserWindow/);
  });

  describe('lint', () => {
    it('should initially pass the linting process', async () => {
      try {
        await api.lint({ dir });
      } catch (err) {
        if (err.stdout) {
          // eslint-disable-next-line no-console
          console.error('STDOUT:', err.stdout.toString());
          // eslint-disable-next-line no-console
          console.error('STDERR:', err.stderr.toString());
        }
        throw err;
      }
    });
  });

  after(async () => {
    await fs.remove(dir);
  });
});
