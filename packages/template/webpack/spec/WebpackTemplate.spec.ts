import fs from 'node:fs';
import path from 'node:path';

import testUtils from '@electron-forge/test-utils';
import { Listr } from 'listr2';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import template from '../src/WebpackTemplate';

describe('WebpackTemplate', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
  });

  afterAll(async () => {
    await fs.promises.rm(dir, { recursive: true });
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
      const file = path.join(dir, filename);
      expect(fs.existsSync(file)).toBe(true);
    });
  });

  it('should move and rewrite the main process file', async () => {
    expect(fs.existsSync(path.join(dir, 'src', 'index.js'))).toBe(false);
    expect(fs.existsSync(path.join(dir, 'src', 'main.js'))).toBe(true);
    const mainFile = (await fs.promises.readFile(path.join(dir, 'src', 'main.js'))).toString();
    expect(mainFile).toMatch(/MAIN_WINDOW_WEBPACK_ENTRY/);
    expect(mainFile).toMatch(/MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY/);
  });

  it('should remove the stylesheet link from the HTML file', async () => {
    expect((await fs.promises.readFile(path.join(dir, 'src', 'index.html'))).toString()).not.toMatch(/link rel="stylesheet"/);
  });
});
