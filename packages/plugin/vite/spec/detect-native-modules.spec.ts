import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  detectNativePackages,
  isNativePackage,
} from '../src/detect-native-modules';

describe('detect-native-modules', () => {
  const tmp = os.tmpdir();
  let testDir: string;

  beforeAll(async () => {
    testDir = await fs.promises.mkdtemp(path.join(tmp, 'forge-native-'));
  });

  afterAll(async () => {
    await fs.promises.rm(testDir, { recursive: true });
  });

  describe('isNativePackage', () => {
    it('detects packages with binding.gyp', async () => {
      const pkgDir = path.join(testDir, 'pkg-gyp');
      await fs.promises.mkdir(pkgDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(pkgDir, 'binding.gyp'),
        '{}',
        'utf-8',
      );

      expect(isNativePackage(pkgDir)).toEqual(true);
    });

    it('detects packages with prebuilds/ directory', async () => {
      const pkgDir = path.join(testDir, 'pkg-prebuilds');
      await fs.promises.mkdir(path.join(pkgDir, 'prebuilds'), {
        recursive: true,
      });

      expect(isNativePackage(pkgDir)).toEqual(true);
    });

    it('detects packages with .node files in build/Release/', async () => {
      const pkgDir = path.join(testDir, 'pkg-node-file');
      const buildDir = path.join(pkgDir, 'build', 'Release');
      await fs.promises.mkdir(buildDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(buildDir, 'addon.node'),
        '',
        'utf-8',
      );

      expect(isNativePackage(pkgDir)).toEqual(true);
    });

    it('detects packages that depend on bindings', async () => {
      const pkgDir = path.join(testDir, 'pkg-bindings-dep');
      await fs.promises.mkdir(pkgDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(pkgDir, 'package.json'),
        JSON.stringify({ dependencies: { bindings: '^1.5.0' } }),
        'utf-8',
      );

      expect(isNativePackage(pkgDir)).toEqual(true);
    });

    it('detects packages that depend on node-gyp-build', async () => {
      const pkgDir = path.join(testDir, 'pkg-gyp-build-dep');
      await fs.promises.mkdir(pkgDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(pkgDir, 'package.json'),
        JSON.stringify({ dependencies: { 'node-gyp-build': '^4.0.0' } }),
        'utf-8',
      );

      expect(isNativePackage(pkgDir)).toEqual(true);
    });

    it('detects packages that depend on prebuild-install', async () => {
      const pkgDir = path.join(testDir, 'pkg-prebuild-dep');
      await fs.promises.mkdir(pkgDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(pkgDir, 'package.json'),
        JSON.stringify({ dependencies: { 'prebuild-install': '^7.0.0' } }),
        'utf-8',
      );

      expect(isNativePackage(pkgDir)).toEqual(true);
    });

    it('returns false for regular JS packages', async () => {
      const pkgDir = path.join(testDir, 'pkg-js-only');
      await fs.promises.mkdir(pkgDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(pkgDir, 'package.json'),
        JSON.stringify({ dependencies: { lodash: '^4.0.0' } }),
        'utf-8',
      );

      expect(isNativePackage(pkgDir)).toEqual(false);
    });

    it('returns false for packages with no markers', async () => {
      const pkgDir = path.join(testDir, 'pkg-empty');
      await fs.promises.mkdir(pkgDir, { recursive: true });

      expect(isNativePackage(pkgDir)).toEqual(false);
    });

    it('returns false for non-existent directories', () => {
      expect(isNativePackage(path.join(testDir, 'does-not-exist'))).toEqual(
        false,
      );
    });
  });

  describe('detectNativePackages', () => {
    let projectDir: string;

    beforeAll(async () => {
      projectDir = path.join(testDir, 'project');
      const nm = path.join(projectDir, 'node_modules');

      // Native package with binding.gyp
      const nativePkg = path.join(nm, 'better-sqlite3');
      await fs.promises.mkdir(nativePkg, { recursive: true });
      await fs.promises.writeFile(
        path.join(nativePkg, 'binding.gyp'),
        '{}',
        'utf-8',
      );

      // Regular JS package
      const jsPkg = path.join(nm, 'lodash');
      await fs.promises.mkdir(jsPkg, { recursive: true });
      await fs.promises.writeFile(
        path.join(jsPkg, 'package.json'),
        JSON.stringify({ name: 'lodash' }),
        'utf-8',
      );

      // Scoped native package
      const scopedPkg = path.join(nm, '@serialport', 'bindings-cpp');
      await fs.promises.mkdir(
        path.join(scopedPkg, 'prebuilds', 'darwin-arm64'),
        { recursive: true },
      );

      // Scoped non-native package
      const scopedJs = path.join(nm, '@serialport', 'parser-readline');
      await fs.promises.mkdir(scopedJs, { recursive: true });
      await fs.promises.writeFile(
        path.join(scopedJs, 'package.json'),
        JSON.stringify({ name: '@serialport/parser-readline' }),
        'utf-8',
      );

      // Hidden directory (should be skipped)
      await fs.promises.mkdir(path.join(nm, '.cache'), { recursive: true });
    });

    it('detects native packages and ignores JS packages', () => {
      const result = detectNativePackages(projectDir);

      expect(result).toContain('better-sqlite3');
      expect(result).not.toContain('lodash');
    });

    it('detects scoped native packages', () => {
      const result = detectNativePackages(projectDir);

      expect(result).toContain('@serialport/bindings-cpp');
      expect(result).not.toContain('@serialport/parser-readline');
    });

    it('skips hidden directories', () => {
      const result = detectNativePackages(projectDir);

      expect(result).not.toContain('.cache');
    });

    it('returns empty array for missing node_modules', () => {
      const result = detectNativePackages(path.join(testDir, 'no-project'));

      expect(result).toEqual([]);
    });
  });
});
