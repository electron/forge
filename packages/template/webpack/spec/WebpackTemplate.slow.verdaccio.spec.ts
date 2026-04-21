import fs from 'node:fs';
import path from 'node:path';

import {
  PACKAGE_MANAGERS,
  spawnPackageManager,
} from '@electron-forge/core-utils';
import * as testUtils from '@electron-forge/test-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// eslint-disable-next-line n/no-missing-import
import { api } from '../../../api/core/dist/api';
import { init } from '../../../external/create-electron-app/src/init';

describe('WebpackTemplate (TypeScript)', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
    await init({
      dir,
      template: 'webpack',
      typescript: true,
      interactive: false,
      electronVersion: '38.2.2',
    });
  });

  afterAll(async () => {
    await spawnPackageManager(PACKAGE_MANAGERS['yarn'], ['unlink', '--all']);
    await fs.promises.rm(dir, { recursive: true, force: true });
  });

  describe('template files are copied to project', () => {
    it.each([
      'tsconfig.json',
      '.oxlintrc.json',
      'forge.config.mts',
      'webpack.main.config.ts',
      'webpack.renderer.config.ts',
      'webpack.rules.ts',
      'webpack.plugins.ts',
      path.join('src', 'main.ts'),
      path.join('src', 'renderer.ts'),
      path.join('src', 'preload.ts'),
    ])(`%s should exist`, async (filename) => {
      expect(fs.existsSync(path.join(dir, filename))).toBe(true);
    });

    it('should ensure js source files from base template are removed', async () => {
      const jsFiles = await Array.fromAsync(
        fs.promises.glob(path.join(dir, 'src', '**', '*.js')),
      );
      expect(jsFiles.length).toEqual(0);
    });

    it('should contain `private:true` in package.json', async () => {
      const packageJSON = JSON.parse(
        await fs.promises.readFile(path.join(dir, 'package.json'), 'utf-8'),
      );
      expect(packageJSON).toHaveProperty('private', true);
    });

    it('should contain electron-forge scripts in package.json', async () => {
      const packageJSON = JSON.parse(
        await fs.promises.readFile(path.join(dir, 'package.json'), 'utf-8'),
      );
      expect(packageJSON.scripts.start).toBe('electron-forge start');
      expect(packageJSON.scripts.package).toBe('electron-forge package');
      expect(packageJSON.scripts.make).toBe('electron-forge make');
      expect(packageJSON.scripts.publish).toBe('electron-forge publish');
    });
  });

  describe('lint', () => {
    it('should initially pass the linting process', async () => {
      delete process.env.TS_NODE_PROJECT;
      await testUtils.expectLintToPass(dir);
    });
  });

  describe('typecheck', () => {
    it('should initially pass the typechecking process', async () => {
      await testUtils.expectTypecheckToPass(dir);
    });
  });

  describe('package', () => {
    let cwd: string;

    beforeAll(async () => {
      delete process.env.TS_NODE_PROJECT;
      cwd = process.cwd();
      process.chdir(dir);
    });

    afterAll(() => {
      process.chdir(cwd);
    });

    it('should pass', async () => {
      await api.package({
        dir,
        interactive: false,
      });
    });
  });
});

describe('WebpackTemplate (JavaScript)', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
    await init({
      dir,
      template: 'webpack',
      typescript: false,
      interactive: false,
      electronVersion: '38.2.2',
    });
  });

  afterAll(async () => {
    await spawnPackageManager(PACKAGE_MANAGERS['yarn'], ['unlink', '--all']);
    await fs.promises.rm(dir, { recursive: true, force: true });
  });

  describe('template files are copied to project', () => {
    it.each([
      '.oxlintrc.json',
      'forge.config.mjs',
      'webpack.main.config.mjs',
      'webpack.renderer.config.mjs',
      'webpack.rules.mjs',
      path.join('src', 'main.js'),
      path.join('src', 'renderer.js'),
      path.join('src', 'preload.js'),
    ])(`%s should exist`, async (filename) => {
      expect(fs.existsSync(path.join(dir, filename))).toBe(true);
    });

    it('should ensure ts source files are not present', async () => {
      const tsFiles = await Array.fromAsync(
        fs.promises.glob(path.join(dir, 'src', '**', '*.ts')),
      );
      expect(tsFiles.length).toEqual(0);
    });

    it('should not have tsconfig.json', async () => {
      expect(fs.existsSync(path.join(dir, 'tsconfig.json'))).toBe(false);
    });

    it('should not have webpack.plugins.ts or webpack.plugins.js', async () => {
      expect(fs.existsSync(path.join(dir, 'webpack.plugins.ts'))).toBe(false);
      expect(fs.existsSync(path.join(dir, 'webpack.plugins.js'))).toBe(false);
    });

    it('should contain `private:true` in package.json', async () => {
      const packageJSON = JSON.parse(
        await fs.promises.readFile(path.join(dir, 'package.json'), 'utf-8'),
      );
      expect(packageJSON).toHaveProperty('private', true);
    });

    it('should contain electron-forge scripts in package.json', async () => {
      const packageJSON = JSON.parse(
        await fs.promises.readFile(path.join(dir, 'package.json'), 'utf-8'),
      );
      expect(packageJSON.scripts.start).toBe('electron-forge start');
      expect(packageJSON.scripts.package).toBe('electron-forge package');
      expect(packageJSON.scripts.make).toBe('electron-forge make');
      expect(packageJSON.scripts.publish).toBe('electron-forge publish');
    });
  });

  describe('lint', () => {
    it('should initially pass the linting process', async () => {
      await testUtils.expectLintToPass(dir);
    });
  });

  describe('package', () => {
    let cwd: string;

    beforeAll(async () => {
      cwd = process.cwd();
      process.chdir(dir);
    });

    afterAll(() => {
      process.chdir(cwd);
    });

    it('should pass', async () => {
      await api.package({
        dir,
        interactive: false,
      });
    });
  });
});
