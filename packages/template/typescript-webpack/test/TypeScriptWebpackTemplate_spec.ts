import * as testUtils from '@electron-forge/test-utils';
import fs from 'fs-extra';
import glob from 'fast-glob';
import path from 'path';
import template from '../src/TypeScriptWebpackTemplate';
import { expect } from 'chai';

describe('TypeScriptWebpackTemplate', () => {
  let dir: string;

  before(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
  });

  it('should succeed in initializing the typescript template', async () => {
    await template.initializeTemplate(dir, {});
  });

  context('template files are copied to project', () => {
    const expectedFiles = [
      'tsconfig.json',
      '.eslintrc.json',
      'webpack.main.config.js',
      'webpack.renderer.config.js',
      'webpack.rules.js',
      'webpack.plugins.js',
      path.join('src', 'index.ts'),
      path.join('src', 'renderer.ts'),
      path.join('src', 'preload.ts'),
    ];
    for (const filename of expectedFiles) {
      it(`${filename} should exist`, async () => {
        await testUtils.expectProjectPathExists(dir, filename, 'file');
      });
    }
  });

  it('should ensure js source files from base template are removed', async () => {
    const jsFiles = await glob(path.join(dir, 'src', '**', '*.js'));
    expect(jsFiles.length).to.equal(0, `The following unexpected js files were found in the src/ folder: ${JSON.stringify(jsFiles)}`);
  });

  describe('lint', () => {
    before(async () => {
      await testUtils.ensureModulesInstalled(
        dir,
        ['electron', 'electron-squirrel-startup'],
        template.devDependencies.filter((moduleName) => moduleName.includes('eslint') || moduleName.includes('typescript'))
      );
    });

    it('should initially pass the linting process', async () => {
      await testUtils.expectLintToPass(dir);
    });
  });

  after(async () => {
    await fs.remove(dir);
  });
});
