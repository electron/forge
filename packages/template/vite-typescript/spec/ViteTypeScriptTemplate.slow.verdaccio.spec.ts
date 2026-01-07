import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  PACKAGE_MANAGERS,
  spawnPackageManager,
} from '@electron-forge/core-utils';
import * as testUtils from '@electron-forge/test-utils';
import glob from 'fast-glob';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// eslint-disable-next-line n/no-missing-import
import { api } from '../../../api/core/dist/api';

describe('ViteTypeScriptTemplate', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
  });

  afterAll(async () => {
    await spawnPackageManager(PACKAGE_MANAGERS['yarn'], ['unlink', '--all']);
    if (os.platform() !== 'win32') {
      // Windows platform `fs.remove(dir)` logic using `npm run test:clear`.
      await fs.promises.rm(dir, { force: true, recursive: true });
    }
  });

  describe('template files are copied to project', () => {
    it('should succeed in initializing the typescript template', async () => {
      await api.init({
        dir,
        template: path.resolve(import.meta.dirname, '..'),
        interactive: false,
        electronVersion: '38.2.2',
      });
    });

    it.each([
      'package.json',
      'tsconfig.json',
      '.eslintrc.json',
      'forge.env.d.ts',
      'forge.config.ts',
      'vite.main.config.ts',
      'vite.preload.config.ts',
      'vite.renderer.config.ts',
      path.join('src', 'main.ts'),
      path.join('src', 'renderer.ts'),
      path.join('src', 'preload.ts'),
    ])(`%s should exist`, async (filename) => {
      expect(fs.existsSync(path.join(dir, filename))).toBe(true);
    });

    it('should ensure js source files from base template are removed', async () => {
      const jsFiles = await glob(path.join(dir, 'src', '**', '*.js'));
      expect(jsFiles.length).toEqual(0);
    });

    it('should contain `private:true` in package.json', async () => {
      const packageJSONString = await fs.promises.readFile(
        path.join(dir, 'package.json'),
        'utf-8',
      );
      const packageJSON = JSON.parse(packageJSONString);
      expect(packageJSON).toHaveProperty('private', true);
    });
  });

  describe('lint', () => {
    it('should initially pass the linting process', async () => {
      delete process.env.TS_NODE_PROJECT;
      await testUtils.expectLintToPass(dir);
    });
  });

  describe('package', () => {
    let cwd: string;

    beforeAll(async () => {
      delete process.env.TS_NODE_PROJECT;
      // Vite resolves plugins via cwd
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
