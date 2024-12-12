import path from 'node:path';

import { yarnOrNpmSpawn } from '@electron-forge/core-utils';
import * as testUtils from '@electron-forge/test-utils';
import { expect } from 'chai';
import glob from 'fast-glob';
import fs from 'fs-extra';

import { api } from '../../../api/core';
import { initLink } from '../../../api/core/src/api/init-scripts/init-link';

describe('WebpackTypeScriptTemplate', () => {
  let dir: string;

  before(async () => {
    await yarnOrNpmSpawn(['link:prepare']);
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
    it('should initially pass the linting process', async () => {
      delete process.env.TS_NODE_PROJECT;
      await testUtils.expectLintToPass(dir);
    });
  });

  describe('package', () => {
    let cwd: string;

    before(async () => {
      delete process.env.TS_NODE_PROJECT;
      // Webpack resolves plugins via cwd
      cwd = process.cwd();
      process.chdir(dir);
      // We need the version of webpack to match exactly during development due to a quirk in
      // typescript type-resolution.  In prod no one has to worry about things like this
      const pj = await fs.readJson(path.resolve(dir, 'package.json'));
      pj.resolutions = {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        webpack: `${require('../../../../node_modules/webpack/package.json').version}`,
      };
      await fs.writeJson(path.resolve(dir, 'package.json'), pj);
      await yarnOrNpmSpawn(['install'], {
        cwd: dir,
      });

      // Installing deps removes symlinks that were added at the start of this
      // spec via `api.init`. So we should re-link local forge dependencies
      // again.
      await initLink(dir);
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
    await yarnOrNpmSpawn(['link:remove']);
    await fs.remove(dir);
  });
});
