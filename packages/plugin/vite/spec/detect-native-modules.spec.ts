import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  detectNativePackages,
  isNativePackage,
  walkTransitiveDependencies,
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

    it('detects packages with a napi field (napi-rs)', async () => {
      const pkgDir = path.join(testDir, 'pkg-napi-field');
      await fs.promises.mkdir(pkgDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(pkgDir, 'package.json'),
        JSON.stringify({
          name: 'pkg-napi-field',
          napi: { binaryName: 'thing' },
        }),
        'utf-8',
      );

      expect(isNativePackage(pkgDir)).toEqual(true);
    });

    describe('napi-rs platform packages via optionalDependencies', () => {
      let projectDir: string;
      let nm: string;

      beforeAll(async () => {
        projectDir = path.join(testDir, 'napi-project');
        nm = path.join(projectDir, 'node_modules');

        // Platform package whose `main` points at a .node binary
        // (e.g. @libsql/darwin-arm64, @parcel/watcher-linux-x64-glibc).
        const mainNodePkg = path.join(nm, '@app', 'native-main-node');
        await fs.promises.mkdir(mainNodePkg, { recursive: true });
        await fs.promises.writeFile(
          path.join(mainNodePkg, 'package.json'),
          JSON.stringify({
            name: '@app/native-main-node',
            main: 'index.node',
            os: ['linux'],
            cpu: ['x64'],
          }),
          'utf-8',
        );

        // Platform package with a .node binary at the package root.
        const rootNodePkg = path.join(nm, 'native-root-node');
        await fs.promises.mkdir(rootNodePkg, { recursive: true });
        await fs.promises.writeFile(
          path.join(rootNodePkg, 'package.json'),
          JSON.stringify({ name: 'native-root-node', main: 'index.js' }),
          'utf-8',
        );
        await fs.promises.writeFile(
          path.join(rootNodePkg, 'addon.node'),
          '',
          'utf-8',
        );

        // Platform package with os/cpu constraints and a nested binary
        // (e.g. @img/sharp-darwin-arm64 ships lib/sharp-*.node).
        const nestedNodePkg = path.join(nm, '@app', 'native-nested-node');
        await fs.promises.mkdir(path.join(nestedNodePkg, 'lib'), {
          recursive: true,
        });
        await fs.promises.writeFile(
          path.join(nestedNodePkg, 'package.json'),
          JSON.stringify({
            name: '@app/native-nested-node',
            main: 'index.cjs',
            os: ['darwin'],
            cpu: ['arm64'],
          }),
          'utf-8',
        );
        await fs.promises.writeFile(
          path.join(nestedNodePkg, 'lib', 'binary.node'),
          '',
          'utf-8',
        );

        // Plain JS optional dependency (should not mark the parent native).
        const jsOptPkg = path.join(nm, 'plain-js-opt');
        await fs.promises.mkdir(jsOptPkg, { recursive: true });
        await fs.promises.writeFile(
          path.join(jsOptPkg, 'package.json'),
          JSON.stringify({ name: 'plain-js-opt', main: 'index.js' }),
          'utf-8',
        );
      });

      const writeWrapper = async (
        name: string,
        optionalDependencies: Record<string, string>,
      ) => {
        const pkgDir = path.join(nm, name);
        await fs.promises.mkdir(pkgDir, { recursive: true });
        await fs.promises.writeFile(
          path.join(pkgDir, 'package.json'),
          JSON.stringify({ name, optionalDependencies }),
          'utf-8',
        );
        return pkgDir;
      };

      it('detects a wrapper whose optional dependency has a .node main', async () => {
        const pkgDir = await writeWrapper('wrapper-main-node', {
          '@app/native-main-node': '^1.0.0',
        });

        expect(isNativePackage(pkgDir)).toEqual(true);
      });

      it('detects a wrapper whose optional dependency ships a root .node file', async () => {
        const pkgDir = await writeWrapper('wrapper-root-node', {
          'native-root-node': '^1.0.0',
        });

        expect(isNativePackage(pkgDir)).toEqual(true);
      });

      it('detects a wrapper whose optional dependency has os/cpu constraints and a nested .node file', async () => {
        const pkgDir = await writeWrapper('wrapper-nested-node', {
          '@app/native-nested-node': '^1.0.0',
        });

        expect(isNativePackage(pkgDir)).toEqual(true);
      });

      it('tolerates uninstalled optional dependencies', async () => {
        const pkgDir = await writeWrapper('wrapper-missing-opt', {
          'not-installed-anywhere': '^1.0.0',
        });

        expect(isNativePackage(pkgDir)).toEqual(false);
      });

      it('does not flag wrappers whose optional dependencies are plain JS', async () => {
        const pkgDir = await writeWrapper('wrapper-js-opt', {
          'plain-js-opt': '^1.0.0',
        });

        expect(isNativePackage(pkgDir)).toEqual(false);
      });
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

  describe('walkTransitiveDependencies', () => {
    let projectDir: string;

    beforeAll(async () => {
      projectDir = path.join(testDir, 'transitive-project');
      const nm = path.join(projectDir, 'node_modules');

      // Native package with a production dependency
      const nativePkg = path.join(nm, 'better-sqlite3');
      await fs.promises.mkdir(nativePkg, { recursive: true });
      await fs.promises.writeFile(
        path.join(nativePkg, 'package.json'),
        JSON.stringify({
          name: 'better-sqlite3',
          dependencies: { bindings: '^1.5.0', 'prebuild-install': '^7.0.0' },
        }),
        'utf-8',
      );

      // Transitive dep with its own dependency
      const bindingsPkg = path.join(nm, 'bindings');
      await fs.promises.mkdir(bindingsPkg, { recursive: true });
      await fs.promises.writeFile(
        path.join(bindingsPkg, 'package.json'),
        JSON.stringify({
          name: 'bindings',
          dependencies: { 'file-uri-to-path': '^1.0.0' },
        }),
        'utf-8',
      );

      // Leaf dep (no further dependencies)
      const leafPkg = path.join(nm, 'file-uri-to-path');
      await fs.promises.mkdir(leafPkg, { recursive: true });
      await fs.promises.writeFile(
        path.join(leafPkg, 'package.json'),
        JSON.stringify({ name: 'file-uri-to-path' }),
        'utf-8',
      );

      // prebuild-install (no package.json to test missing gracefully)
      await fs.promises.mkdir(path.join(nm, 'prebuild-install'), {
        recursive: true,
      });
    });

    it('walks transitive production dependencies', () => {
      const result = walkTransitiveDependencies(projectDir, ['better-sqlite3']);

      expect(result).toContain('better-sqlite3');
      expect(result).toContain('bindings');
      expect(result).toContain('file-uri-to-path');
      expect(result).toContain('prebuild-install');
    });

    it('handles missing packages gracefully', () => {
      const result = walkTransitiveDependencies(projectDir, [
        'nonexistent-pkg',
      ]);

      expect(result).toEqual(new Set(['nonexistent-pkg']));
    });

    it('handles circular dependencies', async () => {
      const nm = path.join(projectDir, 'node_modules');

      const circA = path.join(nm, 'circ-a');
      await fs.promises.mkdir(circA, { recursive: true });
      await fs.promises.writeFile(
        path.join(circA, 'package.json'),
        JSON.stringify({
          name: 'circ-a',
          dependencies: { 'circ-b': '^1.0.0' },
        }),
        'utf-8',
      );

      const circB = path.join(nm, 'circ-b');
      await fs.promises.mkdir(circB, { recursive: true });
      await fs.promises.writeFile(
        path.join(circB, 'package.json'),
        JSON.stringify({
          name: 'circ-b',
          dependencies: { 'circ-a': '^1.0.0' },
        }),
        'utf-8',
      );

      const result = walkTransitiveDependencies(projectDir, ['circ-a']);

      expect(result).toContain('circ-a');
      expect(result).toContain('circ-b');
      expect(result.size).toEqual(2);
    });

    it('returns empty set for empty input', () => {
      const result = walkTransitiveDependencies(projectDir, []);

      expect(result.size).toEqual(0);
    });

    it('walks optionalDependencies and skips uninstalled ones', async () => {
      const optProjectDir = path.join(testDir, 'optional-project');
      const nm = path.join(optProjectDir, 'node_modules');

      const wrapper = path.join(nm, 'napi-wrapper');
      await fs.promises.mkdir(wrapper, { recursive: true });
      await fs.promises.writeFile(
        path.join(wrapper, 'package.json'),
        JSON.stringify({
          name: 'napi-wrapper',
          dependencies: { 'detect-libc': '^2.0.0' },
          optionalDependencies: {
            'napi-wrapper-linux-x64': '^1.0.0',
            'napi-wrapper-darwin-arm64': '^1.0.0',
          },
        }),
        'utf-8',
      );

      const detectLibc = path.join(nm, 'detect-libc');
      await fs.promises.mkdir(detectLibc, { recursive: true });
      await fs.promises.writeFile(
        path.join(detectLibc, 'package.json'),
        JSON.stringify({ name: 'detect-libc' }),
        'utf-8',
      );

      // Only the platform package for the "current" platform is installed.
      const platformPkg = path.join(nm, 'napi-wrapper-linux-x64');
      await fs.promises.mkdir(platformPkg, { recursive: true });
      await fs.promises.writeFile(
        path.join(platformPkg, 'package.json'),
        JSON.stringify({ name: 'napi-wrapper-linux-x64', main: 'index.node' }),
        'utf-8',
      );

      const result = walkTransitiveDependencies(optProjectDir, [
        'napi-wrapper',
      ]);

      expect(result).toContain('napi-wrapper');
      expect(result).toContain('detect-libc');
      expect(result).toContain('napi-wrapper-linux-x64');
      // The platform package for the other platform is not installed and
      // must be skipped silently.
      expect(result).not.toContain('napi-wrapper-darwin-arm64');
    });

    it('resolves nested node_modules before hoisted ones', async () => {
      const nestedProjectDir = path.join(testDir, 'nested-project');
      const nm = path.join(nestedProjectDir, 'node_modules');

      // native-a depends on dep-b@2, nested because the hoisted dep-b is v1.
      const nativeA = path.join(nm, 'native-a');
      await fs.promises.mkdir(nativeA, { recursive: true });
      await fs.promises.writeFile(
        path.join(nativeA, 'package.json'),
        JSON.stringify({
          name: 'native-a',
          dependencies: { 'dep-b': '^2.0.0' },
        }),
        'utf-8',
      );

      // Nested copy of dep-b, with its own dependency.
      const nestedDepB = path.join(nativeA, 'node_modules', 'dep-b');
      await fs.promises.mkdir(nestedDepB, { recursive: true });
      await fs.promises.writeFile(
        path.join(nestedDepB, 'package.json'),
        JSON.stringify({
          name: 'dep-b',
          version: '2.0.0',
          dependencies: { 'dep-c': '^1.0.0' },
        }),
        'utf-8',
      );

      // Hoisted (conflicting) copy of dep-b that must NOT be used.
      const hoistedDepB = path.join(nm, 'dep-b');
      await fs.promises.mkdir(hoistedDepB, { recursive: true });
      await fs.promises.writeFile(
        path.join(hoistedDepB, 'package.json'),
        JSON.stringify({
          name: 'dep-b',
          version: '1.0.0',
          dependencies: { 'wrong-dep': '^1.0.0' },
        }),
        'utf-8',
      );

      const depC = path.join(nm, 'dep-c');
      await fs.promises.mkdir(depC, { recursive: true });
      await fs.promises.writeFile(
        path.join(depC, 'package.json'),
        JSON.stringify({ name: 'dep-c' }),
        'utf-8',
      );

      const result = walkTransitiveDependencies(nestedProjectDir, ['native-a']);

      expect(result).toContain('native-a');
      expect(result).toContain('dep-b');
      // dep-c comes from the nested dep-b@2.
      expect(result).toContain('dep-c');
      // wrong-dep would only appear if the hoisted dep-b@1 had been used.
      expect(result).not.toContain('wrong-dep');
    });

    it('resolves dependencies hoisted above the project dir (workspaces)', async () => {
      const workspaceRoot = path.join(testDir, 'workspace-root');
      const appDir = path.join(workspaceRoot, 'apps', 'my-app');
      const appNm = path.join(appDir, 'node_modules');
      const rootNm = path.join(workspaceRoot, 'node_modules');

      const nativePkg = path.join(appNm, 'native-pkg');
      await fs.promises.mkdir(nativePkg, { recursive: true });
      await fs.promises.writeFile(
        path.join(nativePkg, 'package.json'),
        JSON.stringify({
          name: 'native-pkg',
          dependencies: { 'hoisted-dep': '^1.0.0' },
        }),
        'utf-8',
      );

      // The dependency lives in the workspace root's node_modules.
      const hoistedDep = path.join(rootNm, 'hoisted-dep');
      await fs.promises.mkdir(hoistedDep, { recursive: true });
      await fs.promises.writeFile(
        path.join(hoistedDep, 'package.json'),
        JSON.stringify({ name: 'hoisted-dep' }),
        'utf-8',
      );

      const result = walkTransitiveDependencies(appDir, ['native-pkg']);

      expect(result).toContain('native-pkg');
      expect(result).toContain('hoisted-dep');
    });
  });

  describe('symlinked packages (pnpm-style layouts)', () => {
    let projectDir: string;

    beforeAll(async () => {
      projectDir = path.join(testDir, 'pnpm-project');
      const nm = path.join(projectDir, 'node_modules');

      // Real package contents live in the virtual store.
      const storePkgDir = path.join(
        nm,
        '.pnpm',
        'native-pkg@1.0.0',
        'node_modules',
      );
      const realNativePkg = path.join(storePkgDir, 'native-pkg');
      await fs.promises.mkdir(realNativePkg, { recursive: true });
      await fs.promises.writeFile(
        path.join(realNativePkg, 'binding.gyp'),
        '{}',
        'utf-8',
      );
      await fs.promises.writeFile(
        path.join(realNativePkg, 'package.json'),
        JSON.stringify({
          name: 'native-pkg',
          dependencies: { 'store-helper': '^1.0.0' },
        }),
        'utf-8',
      );

      // The dependency is only reachable as a sibling in the virtual store,
      // not from the top-level node_modules.
      const storeHelper = path.join(storePkgDir, 'store-helper');
      await fs.promises.mkdir(storeHelper, { recursive: true });
      await fs.promises.writeFile(
        path.join(storeHelper, 'package.json'),
        JSON.stringify({ name: 'store-helper' }),
        'utf-8',
      );

      // Top-level node_modules only contains a symlink to the store.
      await fs.promises.symlink(
        realNativePkg,
        path.join(nm, 'native-pkg'),
        'junction',
      );
    });

    it('detects native packages through top-level symlinks', () => {
      const result = detectNativePackages(projectDir);

      expect(result).toContain('native-pkg');
    });

    it('resolves transitive dependencies through the real path', () => {
      const result = walkTransitiveDependencies(projectDir, ['native-pkg']);

      expect(result).toContain('native-pkg');
      expect(result).toContain('store-helper');
    });
  });
});
