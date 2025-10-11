import fs from 'node:fs';
import path from 'node:path';

import {
  PACKAGE_MANAGERS,
  spawnPackageManager,
} from '@electron-forge/core-utils';
import testUtils from '@electron-forge/test-utils';
import glob from 'fast-glob';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// eslint-disable-next-line n/no-missing-import
import { api } from '../../../api/core/dist/api';
import { initLink } from '../../../api/core/src/api/init-scripts/init-link';

describe('WebpackTypeScriptTemplate', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
  });

  it('should succeed in initializing the typescript template', async () => {
    await api.init({
      dir,
      template: path.join(__dirname, '..'),
      interactive: false,
    });
  });

  describe('template files are copied to project', () => {
    it.each([
      'tsconfig.json',
      '.eslintrc.json',
      'forge.config.ts',
      'webpack.main.config.ts',
      'webpack.renderer.config.ts',
      'webpack.rules.ts',
      'webpack.plugins.ts',
      path.join('src', 'index.ts'),
      path.join('src', 'renderer.ts'),
      path.join('src', 'preload.ts'),
    ])(`%s should exist`, async (filename) => {
      expect(fs.existsSync(path.join(dir, filename))).toBe(true);
    });
  });

  it('should ensure js source files from base template are removed', async () => {
    const jsFiles = await glob(path.join(dir, 'src', '**', '*.js'));
    expect(jsFiles.length).toEqual(0);
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
      // Webpack resolves plugins via cwd
      cwd = process.cwd();
      process.chdir(dir);
      /**
       * LOCKFILE FIXTURE USAGE:
       * We use a pre-generated lockfile to avoid needing to disable Yarn's security features.
       *
       * When to regenerate the fixture:
       * - When webpack version is updated in Forge's package.json
       * - When template dependencies change significantly
       * - When Yarn lockfile format changes
       * - When this test starts failing due to dependency resolution issues
       *
       * How to regenerate:
       * Run: yarn ts-node tools/regenerate-lockfile-fixtures.ts
       *
       * This will create a new lockfile with the correct webpack resolution and dependencies.
       */
      // Copy pre-generated lockfile, update the project name, and install with immutable lockfile
      const fixtureLockfile = path.join(
        __dirname,
        'fixtures',
        'test-yarn.lock',
      );
      const targetLockfile = path.join(dir, 'yarn.lock');
      let lockfileContent = await fs.promises.readFile(
        fixtureLockfile,
        'utf-8',
      );
      const currentPackageJson = JSON.parse(
        await fs.promises.readFile(path.join(dir, 'package.json'), 'utf-8'),
      );
      const projectName = currentPackageJson.name;
      lockfileContent = lockfileContent.replace(
        /electron-forge-test-\d+/g,
        projectName,
      );
      await fs.promises.writeFile(targetLockfile, lockfileContent);
      await spawnPackageManager(
        PACKAGE_MANAGERS['yarn'],
        ['install', '--immutable'],
        {
          cwd: dir,
        },
      );

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

  afterAll(async () => {
    await spawnPackageManager(PACKAGE_MANAGERS['yarn'], ['unlink', '--all']);
    await fs.promises.rm(dir, { recursive: true, force: true });
  });
});
