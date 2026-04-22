import fs from 'node:fs';
import path from 'node:path';

import * as testUtils from '@electron-forge/test-utils';
import { Listr } from 'listr2';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import template from '../src/ViteTemplate';

describe('ViteTemplate', () => {
  describe('with typescript: false (default)', () => {
    let dir: string;

    beforeAll(async () => {
      dir = await testUtils.ensureTestDirIsNonexistent();
    });

    afterAll(async () => {
      await fs.promises.rm(dir, { recursive: true });
    });

    it('should succeed in initializing the template', async () => {
      const tasks = await template.initializeTemplate(dir, {});
      const runner = new Listr(tasks, {
        concurrent: false,
        exitOnError: false,
        fallbackRendererCondition:
          Boolean(process.env.DEBUG) || Boolean(process.env.CI),
      });
      await runner.run();
      expect(runner.errors).toHaveLength(0);
    });

    describe('template files are copied to project', () => {
      const expectedFiles = [
        'package.json',
        'forge.config.mjs',
        'vite.main.config.mjs',
        'vite.preload.config.mjs',
        'vite.renderer.config.mjs',
        path.join('src', 'main.js'),
        path.join('src', 'renderer.js'),
        path.join('src', 'preload.js'),
      ];
      it.each(expectedFiles)(`%s should exist`, async (filename) => {
        expect(fs.existsSync(path.join(dir, filename))).toBe(true);
      });

      const unexpectedFiles = [
        'forge.config.mts',
        'tsconfig.json',
        'vite.main.config.ts',
        'vite.preload.config.ts',
        'vite.renderer.config.ts',
        path.join('src', 'main.ts'),
        path.join('src', 'renderer.ts'),
        path.join('src', 'preload.ts'),
      ];
      it.each(unexpectedFiles)(`%s should not exist`, async (filename) => {
        expect(fs.existsSync(path.join(dir, filename))).toBe(false);
      });
    });

    it('should move and rewrite the main process file', async () => {
      expect(fs.existsSync(path.join(dir, 'src', 'index.js'))).toBe(false);
      expect(fs.existsSync(path.join(dir, 'src', 'main.js'))).toBe(true);
      const mainFile = (
        await fs.promises.readFile(path.join(dir, 'src', 'main.js'))
      ).toString();
      expect(mainFile).toMatch(/MAIN_WINDOW_VITE_DEV_SERVER_URL/);
      expect(mainFile).toMatch(
        /\.\.\/renderer\/\${MAIN_WINDOW_VITE_NAME}\/index\.html/,
      );
    });

    it('should produce valid JavaScript without type annotations', async () => {
      const mainFile = (
        await fs.promises.readFile(path.join(dir, 'src', 'main.js'))
      ).toString();
      expect(mainFile).not.toMatch(/:\s*(string|number|boolean|void)\b/);
      expect(mainFile).not.toMatch(/\binterface\b/);
    });

    it('should remove the stylesheet link from the HTML file', async () => {
      expect(
        (await fs.promises.readFile(path.join(dir, 'index.html'))).toString(),
      ).not.toMatch(/link rel="stylesheet"/);
    });

    it('should inject script with .js extension into the HTML file', async () => {
      expect(
        (await fs.promises.readFile(path.join(dir, 'index.html'))).toString(),
      ).toMatch(/src="\/src\/renderer\.js"/);
    });

    it('should reference .js/.mjs paths in forge.config.mjs', async () => {
      const config = (
        await fs.promises.readFile(path.join(dir, 'forge.config.mjs'))
      ).toString();
      expect(config).toMatch(/src\/main\.js/);
      expect(config).toMatch(/src\/preload\.js/);
      expect(config).toMatch(/vite\.main\.config\.mjs/);
      expect(config).toMatch(/vite\.preload\.config\.mjs/);
      expect(config).toMatch(/vite\.renderer\.config\.mjs/);
      expect(config).not.toMatch(/\.ts/);
    });

    it('should not include typecheck script in package.json', async () => {
      const packageJSON = JSON.parse(
        await fs.promises.readFile(path.join(dir, 'package.json'), 'utf-8'),
      );
      expect(packageJSON.scripts.typecheck).toBeUndefined();
    });

    it('should contain `private:true` in package.json', async () => {
      const packageJSON = JSON.parse(
        await fs.promises.readFile(path.join(dir, 'package.json'), 'utf-8'),
      );
      expect(packageJSON).toHaveProperty('private', true);
    });
  });

  describe('with typescript: true', () => {
    let dir: string;

    beforeAll(async () => {
      dir = await testUtils.ensureTestDirIsNonexistent();
    });

    afterAll(async () => {
      await fs.promises.rm(dir, { recursive: true });
    });

    it('should succeed in initializing the template', async () => {
      const tasks = await template.initializeTemplate(dir, {
        typescript: true,
      });
      const runner = new Listr(tasks, {
        concurrent: false,
        exitOnError: false,
        fallbackRendererCondition:
          Boolean(process.env.DEBUG) || Boolean(process.env.CI),
      });
      await runner.run();
      expect(runner.errors).toHaveLength(0);
    });

    describe('template files are copied to project', () => {
      const expectedFiles = [
        'package.json',
        'forge.config.mts',
        'tsconfig.json',
        'vite.main.config.ts',
        'vite.preload.config.ts',
        'vite.renderer.config.ts',
        path.join('src', 'main.ts'),
        path.join('src', 'renderer.ts'),
        path.join('src', 'preload.ts'),
      ];
      it.each(expectedFiles)(`%s should exist`, async (filename) => {
        expect(fs.existsSync(path.join(dir, filename))).toBe(true);
      });

      const unexpectedFiles = [
        'forge.config.mjs',
        'vite.main.config.mjs',
        'vite.preload.config.mjs',
        'vite.renderer.config.mjs',
        path.join('src', 'main.js'),
        path.join('src', 'renderer.js'),
        path.join('src', 'preload.js'),
      ];
      it.each(unexpectedFiles)(`%s should not exist`, async (filename) => {
        expect(fs.existsSync(path.join(dir, filename))).toBe(false);
      });
    });

    it('should move and rewrite the main process file', async () => {
      expect(fs.existsSync(path.join(dir, 'src', 'index.js'))).toBe(false);
      expect(fs.existsSync(path.join(dir, 'src', 'main.ts'))).toBe(true);
      const mainFile = (
        await fs.promises.readFile(path.join(dir, 'src', 'main.ts'))
      ).toString();
      expect(mainFile).toMatch(/MAIN_WINDOW_VITE_DEV_SERVER_URL/);
      expect(mainFile).toMatch(
        /\.\.\/renderer\/\${MAIN_WINDOW_VITE_NAME}\/index\.html/,
      );
    });

    it('should remove the stylesheet link from the HTML file', async () => {
      expect(
        (await fs.promises.readFile(path.join(dir, 'index.html'))).toString(),
      ).not.toMatch(/link rel="stylesheet"/);
    });

    it('should inject script with .ts extension into the HTML file', async () => {
      expect(
        (await fs.promises.readFile(path.join(dir, 'index.html'))).toString(),
      ).toMatch(/src="\/src\/renderer\.ts"/);
    });

    it('should reference .ts paths in forge.config.mts', async () => {
      const config = (
        await fs.promises.readFile(path.join(dir, 'forge.config.mts'))
      ).toString();
      expect(config).toMatch(/src\/main\.ts/);
      expect(config).toMatch(/src\/preload\.ts/);
      expect(config).toMatch(/vite\.main\.config\.ts/);
    });

    it('should include typecheck script in package.json', async () => {
      const packageJSON = JSON.parse(
        await fs.promises.readFile(path.join(dir, 'package.json'), 'utf-8'),
      );
      expect(packageJSON.scripts.typecheck).toBeDefined();
    });

    it('should contain `private:true` in package.json', async () => {
      const packageJSON = JSON.parse(
        await fs.promises.readFile(path.join(dir, 'package.json'), 'utf-8'),
      );
      expect(packageJSON).toHaveProperty('private', true);
    });
  });
});
