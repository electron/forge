import fs from 'node:fs/promises';
import path from 'node:path';

import * as testUtils from '@electron-forge/test-utils';
import { Listr } from 'listr2';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import template from '../src/WebpackTemplate';

describe('WebpackTemplate', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
  });

  afterAll(async () => {
    await fs.rm(dir, { recursive: true });
  });

  it('should succeed in initializing the webpack template', async () => {
    const tasks = await template.initializeTemplate(dir, {});
    const runner = new Listr(tasks, {
      concurrent: false,
      exitOnError: false,
      fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
    });
    await runner.run();
    expect(runner.errors).toHaveLength(0);
  });

  describe('template files are copied to project', () => {
    const expectedFiles = [
      'webpack.main.config.js',
      'webpack.renderer.config.js',
      'webpack.rules.js',
      path.join('src', 'renderer.js'),
      path.join('src', 'preload.js'),
    ];
    it.each(expectedFiles)(`%s should exist`, async (filename) => {
      await testUtils.expectProjectPathExists(dir, filename, 'file');
    });
  });

  it('should move and rewrite the main process file', async () => {
    await testUtils.expectProjectPathNotExists(dir, path.join('src', 'index.js'), 'file');
    await testUtils.expectProjectPathExists(dir, path.join('src', 'main.js'), 'file');
    const mainFile = (await fs.readFile(path.join(dir, 'src', 'main.js'))).toString();
    expect(mainFile).toMatch(/MAIN_WINDOW_WEBPACK_ENTRY/);
    expect(mainFile).toMatch(/MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY/);
  });

  it('should remove the stylesheet link from the HTML file', async () => {
    expect((await fs.readFile(path.join(dir, 'src', 'index.html'))).toString()).not.toMatch(/link rel="stylesheet"/);
  });
});
