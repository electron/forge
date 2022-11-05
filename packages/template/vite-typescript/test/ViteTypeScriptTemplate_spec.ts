import path from 'path';

import * as testUtils from '@electron-forge/test-utils';
import { expect } from 'chai';
import glob from 'fast-glob';
// import fs from 'fs-extra';
import { Listr } from 'listr2';

import template from '../src/ViteTypeScriptTemplate';

describe('ViteTypeScriptTemplate', () => {
  let dir: string;

  before(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
  });

  it('should succeed in initializing the vite template', async () => {
    const tasks = await template.initializeTemplate(dir, {});
    const runner = new Listr(tasks, { concurrent: false, exitOnError: false });
    await runner.run();
    expect(runner.err).to.have.lengthOf(0);
  });

  context('template files are copied to project', () => {
    const expectedFiles = [
      '.eslintrc.json',
      'electron.vite.config.ts',
      'forge.config.cjs',
      'tsconfig.json',
      'tsconfig.node.json',
      'tsconfig.web.json',
      path.join('src', 'main', 'index.ts'),
      path.join('src', 'preload', 'index.ts'),
      path.join('src', 'renderer', 'index.html'),
      path.join('src', 'renderer', 'renderer.ts'),
      path.join('src', 'renderer', 'index.css'),
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

  after(async () => {
    // await fs.remove(dir);
  });
});
