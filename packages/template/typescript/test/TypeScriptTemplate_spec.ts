import * as testUtils from '@electron-forge/test-utils';
import { expect } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import template from '../src/TypeScriptTemplate';

describe('TypeScriptTemplate', () => {
  let dir: string;

  before(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
  });

  it('should succeed in initializing the typescript template', async () => {
    await template.initializeTemplate(dir);
  });

  context('template files are copied to project', () => {
    const expectedFiles = ['.eslintrc.json', 'tsconfig.json', path.join('src', 'preload.ts')];
    for (const filename of expectedFiles) {
      it(`${filename} should exist`, async () => {
        await testUtils.expectProjectPathExists(dir, filename, 'file');
      });
    }
  });

  it('should convert the main process file to typescript', async () => {
    await testUtils.expectProjectPathNotExists(dir, path.join('src', 'index.js'), 'file');
    await testUtils.expectProjectPathExists(dir, path.join('src', 'index.ts'), 'file');
    expect((await fs.readFile(path.join(dir, 'src', 'index.ts'))).toString()).to.match(/import\b.*\bBrowserWindow\b/);
  });

  describe('lint', () => {
    before(async () => {
      await testUtils.ensureModulesInstalled(dir, ['electron', 'electron-squirrel-startup'], template.devDependencies);
    });

    it('should initially pass the linting process', async () => {
      await testUtils.expectLintToPass(dir);
    });
  });

  after(async () => {
    await fs.remove(dir);
  });
});
