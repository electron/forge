import fs from 'node:fs';
import path from 'node:path';

import {
  ensureTestDirIsNonexistent,
  expectLintToPass,
} from '@electron-forge/test-utils';
import semver from 'semver';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { api } from '../../src/api/index';

describe('init', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await ensureTestDirIsNonexistent();
    return async () => {
      await fs.promises.rm(dir, { recursive: true, force: true });
    };
  });

  it('works (base case)', async () => {
    await api.init({
      dir,
    });
    expect(fs.existsSync(dir)).toEqual(true);
    expect(fs.existsSync(path.join(dir, 'package.json'))).toEqual(true);
    expect(fs.existsSync(path.join(dir, '.git'))).toEqual(true);
    expect(fs.existsSync(path.resolve(dir, 'node_modules/electron'))).toEqual(
      true,
    );
    expect(
      fs.existsSync(
        path.resolve(dir, 'node_modules/electron-squirrel-startup'),
      ),
    ).toEqual(true);
    expect(
      fs.existsSync(path.resolve(dir, 'node_modules/@electron-forge/cli')),
    ).toEqual(true);
    expect(fs.existsSync(path.join(dir, 'forge.config.js'))).toEqual(true);

    // init should create a `private: true` npm package
    const packageJSONString = await fs.promises.readFile(
      path.join(dir, 'package.json'),
      'utf-8',
    );
    const packageJSON = JSON.parse(packageJSONString);
    expect(packageJSON).toHaveProperty('private', true);
  });

  describe('with electronVersion', () => {
    it('can define a specific Electron version with a version number', async () => {
      await api.init({
        dir,
        electronVersion: 'v38.0.0',
      });
      const packageJSON = await import(path.resolve(dir, 'package.json'));
      expect(packageJSON.devDependencies.electron).toEqual('38.0.0');
    });

    it('can define a specific Electron nightly version with a version number', async () => {
      await api.init({
        dir,
        electronVersion: '40.0.0-nightly.20251020',
      });
      const packageJSON = await import(path.resolve(dir, 'package.json'));
      expect(
        semver.valid(packageJSON.devDependencies['electron-nightly']),
      ).not.toBeNull();
      expect(packageJSON.devDependencies.electron).not.toBeDefined();
    });

    it('can define a specific Electron prerelease version with the beta tag', async () => {
      await api.init({
        dir,
        electronVersion: 'beta',
      });
      const packageJSON = await import(path.resolve(dir, 'package.json'));
      const prereleaseTag = semver.prerelease(
        packageJSON.devDependencies.electron,
      );
      expect(prereleaseTag).toEqual(
        expect.arrayContaining([expect.stringMatching(/alpha|beta/)]),
      );
    });

    it('can define a specific Electron nightly version with the nightly tag', async () => {
      await api.init({
        dir,
        electronVersion: 'nightly',
      });
      const packageJSON = await import(path.resolve(dir, 'package.json'));
      expect(
        semver.valid(packageJSON.devDependencies['electron-nightly']),
      ).not.toBeNull();
      expect(packageJSON.devDependencies.electron).not.toBeDefined();
    });
  });

  describe('with skipGit', () => {
    it('should not initialize a git repo if passed the skipGit option', async () => {
      await api.init({
        dir,
        skipGit: true,
      });
      expect(fs.existsSync(path.join(dir, '.git'))).toEqual(false);
    });
  });

  describe('with custom template', () => {
    it('adds all files correctly', async () => {
      await api.init({
        dir,
        template: path.resolve(__dirname, '../fixture/custom_init'),
      });

      // folder exists
      expect(fs.existsSync(dir)).toEqual(true);

      // check package.json
      expect(fs.existsSync(path.join(dir, 'package.json'))).toEqual(true);
      const packageJSON = JSON.parse(
        fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'),
      );

      // dependencies installed
      expect(packageJSON.dependencies).toHaveProperty('semver');
      expect(packageJSON.dependencies.semver).toEqual('7.7.3');
      // devDependencies installed
      expect(packageJSON.devDependencies).toHaveProperty('@types/semver');
      expect(packageJSON.devDependencies['@types/semver']).toEqual('7.7.1');

      // dotfiles copied over
      expect(fs.existsSync(path.join(dir, '.bar'))).toEqual(true);

      // deep files copied over
      expect(fs.existsSync(path.join(dir, 'src/foo.js'))).toBe(true);
      expect(fs.existsSync(path.join(dir, 'src/index.html'))).toBe(true);

      // should pass linting
      await expectLintToPass(dir);
    });

    describe('without a required Forge version)', () => {
      it('should fail in initializing', async () => {
        await expect(
          api.init({
            dir,
            template: path.resolve(
              __dirname,
              '../fixture/template-sans-forge-version',
            ),
          }),
        ).rejects.toThrow(/it does not specify its required Forge version\.$/);
      });
    });

    describe('with a non-matching Forge version', () => {
      it('should fail in initializing', async () => {
        await expect(
          api.init({
            dir,
            template: path.resolve(
              __dirname,
              '../fixture/template-nonmatching-forge-version',
            ),
          }),
        ).rejects.toThrow(
          /is not compatible with this version of Electron Forge/,
        );
      });
    });

    describe('with a nonexistent template', () => {
      it('should fail in initializing', async () => {
        await expect(
          api.init({
            dir,
            template: 'does-not-exist',
          }),
        ).rejects.toThrow('Failed to locate custom template');
      });
    });
  });

  describe('in an existing directory', () => {
    // Use a separate dir here and only clear it after all tests in this block have run
    let persistentDir: string;
    beforeAll(async () => {
      persistentDir = await ensureTestDirIsNonexistent();
      await api.init({ dir: persistentDir });
      return async () => {
        await fs.promises.rm(persistentDir, { recursive: true, force: true });
      };
    });

    it('should fail without the force flag', async () => {
      await expect(api.init({ dir: persistentDir })).rejects.toThrow(
        `The specified path: "${persistentDir}" is not empty.  Please ensure it is empty before initializing a new project`,
      );
    });

    it('should pass with the force flag', async () => {
      await api.init({
        dir: persistentDir,
        force: true,
      });
    });
  });

  describe.todo('with CI files enabled');

  describe('package managers', () => {
    describe('with npm', () => {
      beforeAll(() => {
        process.env.COREPACK_ENABLE_STRICT = '0';
      });

      it('initializes with package-lock.json', async () => {
        await api.init({ dir, packageManager: 'npm' });

        expect(fs.existsSync(path.join(dir, 'package-lock.json'))).toBe(true);
        expect(fs.existsSync(path.join(dir, 'yarn.lock'))).toBe(false);
        expect(fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))).toBe(false);
      });
    });

    // NOTE: we basically run all tests via Yarn Berry anyways
    // due to the `packageManager` entry in this monorepo.
    describe('with yarn (berry)', () => {
      it('initializes with correct nodeLinker value', async () => {
        await api.init({ dir, packageManager: 'yarn@4.10.3' });

        expect(
          fs.readFileSync(path.join(dir, '.yarnrc.yml'), 'utf-8'),
        ).toContain('nodeLinker: node-modules');

        // If `nodeLinker: node-modules`, we can expect node_modules to be instantiated properly
        expect(
          fs
            .statSync(path.join(dir, 'node_modules', 'electron'))
            .isSymbolicLink(),
        ).toBe(false);
        expect(
          fs
            .statSync(path.join(dir, 'node_modules', '@electron-forge', 'cli'))
            .isSymbolicLink(),
        ).toBe(false);

        expect(fs.existsSync(path.join(dir, 'package-lock.json'))).toBe(false);
        expect(fs.existsSync(path.join(dir, 'yarn.lock'))).toBe(true);
        expect(fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))).toBe(false);
      });
    });

    describe('with pnpm', () => {
      beforeAll(() => {
        // disable corepack strict to allow pnpm to be used
        process.env.COREPACK_ENABLE_STRICT = '0';
      });

      it('initializes with correct node-linker value', async () => {
        await api.init({ dir, packageManager: 'pnpm' });

        expect(fs.readFileSync(path.join(dir, '.npmrc'), 'utf-8')).toContain(
          'node-linker = hoisted',
        );

        // If `node-linker = hoisted`, we can expect node_modules to be instantiated properly
        expect(
          fs
            .statSync(path.join(dir, 'node_modules', 'electron'))
            .isSymbolicLink(),
        ).toBe(false);
        expect(
          fs
            .statSync(path.join(dir, 'node_modules', '@electron-forge', 'cli'))
            .isSymbolicLink(),
        ).toBe(false);

        expect(fs.existsSync(path.join(dir, 'package-lock.json'))).toBe(false);
        expect(fs.existsSync(path.join(dir, 'yarn.lock'))).toBe(false);
        expect(fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))).toBe(true);
      });
    });
  });
});
