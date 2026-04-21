import fs from 'node:fs';
import path from 'node:path';

import * as testUtils from '@electron-forge/test-utils';
import { Listr } from 'listr2';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import template from '../src/WebpackTemplate';

describe('WebpackTemplate', () => {
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
        'webpack.main.config.mjs',
        'webpack.renderer.config.mjs',
        'webpack.rules.mjs',
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
        'webpack.main.config.ts',
        'webpack.renderer.config.ts',
        'webpack.rules.ts',
        'webpack.plugins.ts',
        'webpack.plugins.js',
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
      expect(mainFile).toMatch(/MAIN_WINDOW_WEBPACK_ENTRY/);
      expect(mainFile).toMatch(/MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY/);
    });

    it('should produce valid JavaScript without type annotations', async () => {
      const mainFile = (
        await fs.promises.readFile(path.join(dir, 'src', 'main.js'))
      ).toString();
      expect(mainFile).not.toMatch(/:\s*(string|number|boolean|void)\b/);
      expect(mainFile).not.toMatch(/\binterface\b/);
      expect(mainFile).not.toMatch(/\bdeclare\s+const\b/);
    });

    it('should not include ts-loader rule in webpack.rules.mjs', async () => {
      const rules = (
        await fs.promises.readFile(path.join(dir, 'webpack.rules.mjs'))
      ).toString();
      expect(rules).not.toMatch(/ts-loader/);
      expect(rules).not.toMatch(/\.tsx\?\$/);
    });

    it('should not include plugins or resolve.extensions in webpack configs', async () => {
      for (const name of [
        'webpack.main.config.mjs',
        'webpack.renderer.config.mjs',
      ]) {
        const config = (
          await fs.promises.readFile(path.join(dir, name))
        ).toString();
        expect(config).not.toMatch(/webpack\.plugins/);
        expect(config).not.toMatch(/resolve:/);
        expect(config).not.toMatch(/extensions:/);
      }
    });

    it('should use string paths in forge.config.mjs for JS variant', async () => {
      const config = (
        await fs.promises.readFile(path.join(dir, 'forge.config.mjs'))
      ).toString();
      expect(config).toMatch(/webpack\.main\.config\.mjs/);
      expect(config).toMatch(/webpack\.renderer\.config\.mjs/);
      expect(config).toMatch(/src\/renderer\.js/);
      expect(config).toMatch(/src\/preload\.js/);
    });

    it('should remove the stylesheet link from the HTML file', async () => {
      expect(
        (
          await fs.promises.readFile(path.join(dir, 'src', 'index.html'))
        ).toString(),
      ).not.toMatch(/link rel="stylesheet"/);
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
        'webpack.main.config.ts',
        'webpack.renderer.config.ts',
        'webpack.rules.ts',
        'webpack.plugins.ts',
        path.join('src', 'main.ts'),
        path.join('src', 'renderer.ts'),
        path.join('src', 'preload.ts'),
      ];
      it.each(expectedFiles)(`%s should exist`, async (filename) => {
        expect(fs.existsSync(path.join(dir, filename))).toBe(true);
      });

      const unexpectedFiles = [
        'forge.config.mjs',
        'webpack.main.config.js',
        'webpack.main.config.mjs',
        'webpack.renderer.config.js',
        'webpack.renderer.config.mjs',
        'webpack.rules.js',
        'webpack.rules.mjs',
        'webpack.plugins.js',
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
      expect(mainFile).toMatch(/MAIN_WINDOW_WEBPACK_ENTRY/);
      expect(mainFile).toMatch(/MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY/);
    });

    it('should include ts-loader rule in webpack.rules.ts', async () => {
      const rules = (
        await fs.promises.readFile(path.join(dir, 'webpack.rules.ts'))
      ).toString();
      expect(rules).toMatch(/ts-loader/);
    });

    it('should include webpack.plugins.ts with fork-ts-checker', async () => {
      const plugins = (
        await fs.promises.readFile(path.join(dir, 'webpack.plugins.ts'))
      ).toString();
      expect(plugins).toMatch(/ForkTsCheckerWebpackPlugin/);
    });

    it('should include resolve.extensions in webpack configs', async () => {
      for (const name of [
        'webpack.main.config.ts',
        'webpack.renderer.config.ts',
      ]) {
        const config = (
          await fs.promises.readFile(path.join(dir, name))
        ).toString();
        expect(config).toMatch(/extensions:/);
      }
    });

    it('should remove the stylesheet link from the HTML file', async () => {
      expect(
        (
          await fs.promises.readFile(path.join(dir, 'src', 'index.html'))
        ).toString(),
      ).not.toMatch(/link rel="stylesheet"/);
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
