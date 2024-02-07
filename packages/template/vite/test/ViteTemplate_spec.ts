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
      'vite.renderer.config.mjs',
      'vite.main.config.mjs',
      'vite.preload.config.mjs',
      path.join('src', 'renderer.js'),
      path.join('src', 'preload.js'),
    ];
    for (const filename of expectedFiles) {
      it(`${filename} should exist`, async () => {
        await testUtils.expectProjectPathExists(dir, filename, 'file');
      });
    }
  });

  it('should move and rewrite the main process file', async () => {
    await testUtils.expectProjectPathNotExists(dir, path.join('src', 'index.js'), 'file');
    await testUtils.expectProjectPathExists(dir, path.join('src', 'main.js'), 'file');
    const mainFile = (await fs.readFile(path.join(dir, 'src', 'main.js'))).toString();
    expect(mainFile).to.match(/MAIN_WINDOW_VITE_DEV_SERVER_URL/);
    expect(mainFile).to.match(/\.\.\/renderer\/\${MAIN_WINDOW_VITE_NAME}\/index\.html/);
  });

  it('should remove the stylesheet link from the HTML file', async () => {
    expect((await fs.readFile(path.join(dir, 'index.html'))).toString()).to.not.match(/link rel="stylesheet"/);
  });

  it('should inject script into the HTML file', async () => {
    expect((await fs.readFile(path.join(dir, 'index.html'))).toString()).to.match(/src="\/src\/renderer\.js"/);
  });

  after(async () => {
    await fs.remove(dir);
  });
});
