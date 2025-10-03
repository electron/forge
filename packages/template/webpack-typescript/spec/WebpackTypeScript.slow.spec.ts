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
      // We need the version of webpack to match exactly during development due to a quirk in
      // typescript type-resolution.  In prod no one has to worry about things like this
      const pj = JSON.parse(
        await fs.promises.readFile(path.resolve(dir, 'package.json'), 'utf-8'),
      );
      pj.resolutions = {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        webpack: `${require('../../../../node_modules/webpack/package.json').version}`,
      };
      await fs.promises.writeFile(
        path.resolve(dir, 'package.json'),
        JSON.stringify(pj),
      );
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

  afterAll(async () => {
    await spawnPackageManager(PACKAGE_MANAGERS['yarn'], ['unlink', '--all']);
    await fs.promises.rm(dir, { recursive: true, force: true });
  });
});
