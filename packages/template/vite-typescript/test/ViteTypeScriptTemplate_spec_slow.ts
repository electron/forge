import path from 'path';

import { yarnOrNpmSpawn } from '@electron-forge/core-utils';
import * as testUtils from '@electron-forge/test-utils';
import { expect } from 'chai';
import glob from 'fast-glob';
import fs from 'fs-extra';

import { api } from '../../../api/core';

describe('ViteTypeScriptTemplate', () => {
  let dir: string;

  before(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
  });

  it('should succeed in initializing the typescript template', async () => {
    await api.init({
      dir,
      template: path.resolve(__dirname, '..', 'src', 'ViteTypeScriptTemplate'),
      interactive: false,
    });
  });

  context('template files are copied to project', () => {
    const expectedFiles = [
      'tsconfig.json',
      '.eslintrc.json',
      'forge.config.ts',
      'vite.main.config.ts',
      'vite.renderer.config.ts',
      'vite.preload.config.ts',
      path.join('src', 'main.ts'),
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
    it('should initially pass the linting process', async () => {
      delete process.env.TS_NODE_PROJECT;
      await testUtils.expectLintToPass(dir);
    });
  });

  describe('package', () => {
    let cwd: string;

    before(async () => {
      delete process.env.TS_NODE_PROJECT;
      // Vite resolves plugins via cwd
      cwd = process.cwd();
      process.chdir(dir);
      // We need the version of vite to match exactly during development due to a quirk in
      // typescript type-resolution.  In prod no one has to worry about things like this
      const pj = await fs.readJson(path.resolve(dir, 'package.json'));
      pj.resolutions = {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        vite: `${require('../../../../node_modules/vite/package.json').version}`,
      };
      await fs.writeJson(path.resolve(dir, 'package.json'), pj);
      await yarnOrNpmSpawn(['install'], {
        cwd: dir,
      });
    });

    after(() => {
      process.chdir(cwd);
    });

    it('should pass', async () => {
      await api.package({
        dir,
        interactive: false,
      });
    });
  });

  after(async () => {
    await fs.remove(dir);
  });
});
