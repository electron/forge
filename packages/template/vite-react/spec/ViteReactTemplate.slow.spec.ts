import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  PACKAGE_MANAGERS,
  spawnPackageManager,
} from '@electron-forge/core-utils';
import testUtils from '@electron-forge/test-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// eslint-disable-next-line n/no-missing-import
import { api } from '../../../api/core/dist/api';
import { initLink } from '../../../api/core/src/api/init-scripts/init-link';

describe('ViteReactTemplate', () => {
  let dir: string;

  beforeAll(async () => {
    await spawnPackageManager(PACKAGE_MANAGERS['yarn'], [
      'run',
      'link:prepare',
    ]);
    dir = await testUtils.ensureTestDirIsNonexistent();
  });

  afterAll(async () => {
    await spawnPackageManager(PACKAGE_MANAGERS['yarn'], ['run', 'link:remove']);
    if (os.platform() !== 'win32') {
      // Windows platform `fs.remove(dir)` logic using `npm run test:clear`.
      await fs.promises.rm(dir, { force: true, recursive: true });
    }
  });

  describe('template files are copied to project', () => {
    it('should succeed in initializing the typescript template', async () => {
      await api.init({
        dir,
        template: path.resolve(__dirname, '..'),
        interactive: false,
      });
    });

    it.each([
      'package.json',
      'forge.config.js',
      'eslint.config.js',
      'vite.main.config.mjs',
      'vite.preload.config.mjs',
      'vite.renderer.config.mjs',
      path.join('src', 'main.js'),
      path.join('src', 'index.jsx'),
      path.join('src', 'renderer.jsx'),
      path.join('src', 'preload.js'),
    ])(`%s should exist`, async (filename) => {
      expect(fs.existsSync(path.join(dir, filename))).toBe(true);
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
      // Vite resolves plugins via cwd
      cwd = process.cwd();
      process.chdir(dir);

      await spawnPackageManager(PACKAGE_MANAGERS['yarn'], ['install'], {
        cwd: dir,
      });

      // Installing deps removes symlinks that were added at the start of this
      // spec via `api.init`. So we should re-link local forge dependencies
      // again.
      await initLink(PACKAGE_MANAGERS['yarn'], dir);
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
