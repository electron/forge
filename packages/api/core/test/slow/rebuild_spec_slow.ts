import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';
import { RebuildOptions } from 'electron-rebuild/lib/src/rebuild';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

import { expect } from 'chai';

import rebuild from '../../src/util/rebuild';
import { yarnOrNpmSpawn, hasYarn } from '../../src/util/yarn-or-npm';

describe('rebuilder', () => {
  const testModulePath = path.resolve(os.tmpdir(), 'electron-forge-rebuild-test');

  async function setupProject() {
    await fs.remove(testModulePath);
    await fs.mkdirs(testModulePath);
    await fs.writeFile(path.resolve(testModulePath, 'package.json'), await fs.readFile(path.resolve(__dirname, '../fixture/native_app/package.json'), 'utf8'));
    await yarnOrNpmSpawn(hasYarn() ? [] : ['install'], {
      cwd: testModulePath,
      stdio: process.platform === 'win32' ? 'inherit' : 'pipe',
    });
  }

  async function doRebuild(config?: Partial<RebuildOptions>) {
    await rebuild(testModulePath, '5.0.12', process.platform as ForgePlatform, process.arch as ForgeArch, config);
  }

  describe('no config', () => {
    before(async () => {
      await setupProject();
      await doRebuild();
    });

    it('should have rebuilt top level prod dependencies', async () => {
      const forgeMeta = path.resolve(testModulePath, 'node_modules', 'ref-napi', 'build', 'Release', '.forge-meta');
      expect(await fs.pathExists(forgeMeta), 'ref-napi build meta should exist').to.equal(true);
    });

    it('should have rebuilt children of top level prod dependencies', async () => {
      const forgeMeta = path.resolve(testModulePath, 'node_modules', 'cmark-gfm', 'build', 'Release', '.forge-meta');
      expect(await fs.pathExists(forgeMeta), 'cmark-gfm build meta should exist').to.equal(true);
    });

    it('should have rebuilt children of scoped top level prod dependencies', async () => {
      const forgeMeta = path.resolve(testModulePath, 'node_modules', '@nlv8/signun', 'build', 'Release', '.forge-meta');
      expect(await fs.pathExists(forgeMeta), '@nlv8/signun build meta should exist').to.equal(true);
    });

    it('should have rebuilt top level optional dependencies', async () => {
      const forgeMeta = path.resolve(testModulePath, 'node_modules', 'bcrypt', 'build', 'Release', '.forge-meta');
      expect(await fs.pathExists(forgeMeta), 'bcrypt build meta should exist').to.equal(true);
    });

    it('should not have rebuilt top level devDependencies', async () => {
      const forgeMeta = path.resolve(testModulePath, 'node_modules', 'ffi-napi', 'build', 'Release', '.forge-meta');
      expect(await fs.pathExists(forgeMeta), 'ffi-napi build meta should not exist').to.equal(false);
    });
  });

  describe('with config', () => {
    before(async () => {
      await setupProject();
      await doRebuild({ onlyModules: ['ref-napi'] });
    });

    it('should have rebuilt module in onlyModules', async () => {
      const forgeMeta = path.resolve(testModulePath, 'node_modules', 'ref-napi', 'build', 'Release', '.forge-meta');
      expect(await fs.pathExists(forgeMeta), 'ref-napi build meta should exist').to.equal(true);
    });

    it('should not have rebuilt module not in onlyModules', async () => {
      const forgeMeta = path.resolve(testModulePath, 'node_modules', 'bcrypt', 'build', 'Release', '.forge-meta');
      expect(await fs.pathExists(forgeMeta), 'bcrypt build meta should not exist').to.equal(false);
    });
  });

  after(async () => {
    await fs.remove(testModulePath);
  });
});
