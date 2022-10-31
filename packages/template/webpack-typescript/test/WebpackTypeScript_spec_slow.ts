import path from 'path';

import * as testUtils from '@electron-forge/test-utils';
import { expect } from 'chai';
import glob from 'fast-glob';
import fs from 'fs-extra';

import { api } from '../../../api/core';
import template from '../src/WebpackTypeScriptTemplate';

describe('WebpackTypeScriptTemplate', () => {
  let dir: string;

  before(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
  });

  it('should succeed in initializing the typescript template', async () => {
    await api.init({
      dir,
      template: path.resolve(__dirname, '..', 'src', 'WebpackTypeScriptTemplate'),
      interactive: false,
    });
  });

  context('template files are copied to project', () => {
    const expectedFiles = [
      'tsconfig.json',
      '.eslintrc.json',
      'forge.config.ts',
      'webpack.main.config.ts',
      'webpack.renderer.config.ts',
      'webpack.rules.ts',
      'webpack.plugins.ts',
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
      delete process.env.TS_NODE_PROJECT;
      await testUtils.ensureModulesInstalled(
        dir,
        ['electron', 'electron-squirrel-startup'],
        template.devDependencies
          .filter((moduleName) => moduleName.includes('eslint') || moduleName.includes('typescript'))
          .concat(['@electron-forge/plugin-webpack'])
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
