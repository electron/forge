import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PACKAGE_MANAGERS, spawnPackageManager } from '@electron-forge/core-utils';
import testUtils from '@electron-forge/test-utils';
import glob from 'fast-glob';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// eslint-disable-next-line n/no-missing-import
import { api } from '../../../api/core/dist/api';
import { initLink } from '../../../api/core/src/api/init-scripts/init-link';

describe('ViteTypeScriptTemplate', () => {
  let dir: string;

  beforeAll(async () => {
    await spawnPackageManager(PACKAGE_MANAGERS['yarn'], ['run', 'link:prepare']);
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
      // We need the version of vite to match exactly during development due to a quirk in
      // typescript type-resolution.  In prod no one has to worry about things like this
      const pj = JSON.parse(await fs.promises.readFile(path.resolve(dir, 'package.json'), 'utf-8'));
      pj.resolutions = {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        vite: `${require('../../../../node_modules/vite/package.json').version}`,
      };
      await fs.promises.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(pj));
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
