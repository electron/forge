import path from 'path';

import * as testUtils from '@electron-forge/test-utils';
import { expect } from 'chai';
import fs from 'fs-extra';
import { Listr } from 'listr2';

import template from '../src/ViteTemplate';

describe('ViteTemplate', () => {
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
      'electron.vite.config.js',
      'forge.config.js',
      path.join('src', 'main', 'index.js'),
      path.join('src', 'preload', 'index.js'),
      path.join('src', 'renderer', 'index.html'),
      path.join('src', 'renderer', 'renderer.js'),
      path.join('src', 'renderer', 'index.css'),
    ];
    for (const filename of expectedFiles) {
      it(`${filename} should exist`, async () => {
        await testUtils.expectProjectPathExists(dir, filename, 'file');
      });
    }
  });

  after(async () => {
    await fs.remove(dir);
  });
});
