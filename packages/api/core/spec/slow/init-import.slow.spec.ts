import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { ForgeConfig } from '@electron-forge/shared-types';
import {
  ensureTestDirIsNonexistent,
  expectLintToPass,
} from '@electron-forge/test-utils';
import semver from 'semver';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { api, InitOptions } from '../../src/api/index';
import { readRawPackageJson } from '../../src/util/read-package-json';

type BeforeInitFunction = () => void;
type PackageJSON = Record<string, unknown> & {
  config: {
    forge: ForgeConfig;
  };
  dependencies: Record<string, string>;
};

async function updatePackageJSON(
  dir: string,
  packageJSONUpdater: (packageJSON: PackageJSON) => Promise<void>,
) {
  const packageJSON = await readRawPackageJson(dir);
  await packageJSONUpdater(packageJSON);
  await fs.promises.writeFile(
    path.resolve(dir, 'package.json'),
    JSON.stringify(packageJSON),
    'utf-8',
  );
}

describe.skip('init params', () => {
  let dir: string;
  describe('init (with electronVersion)', () => {
    beforeEach(async () => {
      dir = await ensureTestDirIsNonexistent();

      return async () => {
        await fs.promises.rm(dir, { recursive: true, force: true });
      };
    });

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
});

describe.each(['npm', 'yarn', 'pnpm'])(`init (with $executable)`, (pm) => {
  beforeAll(() => {
    const originalPM = process.env.NODE_INSTALLER;
    process.env.NODE_INSTALLER = pm;

    // disable corepack strict to allow pnpm to be used
    process.env.COREPACK_ENABLE_STRICT = '0';

    return () => {
      process.env.NODE_INSTALLER = originalPM;
    };
  });

  const beforeInitTest = (
    params?: Partial<InitOptions>,
    beforeInit?: BeforeInitFunction,
  ) => {
    beforeAll(async () => {
      dir = await ensureTestDirIsNonexistent();
      if (beforeInit) {
        beforeInit();
      }
      const projectRoot = path.resolve(__dirname, '../../../../../');
      await api.init({
        ...params,
        dir,
        localForgePath: projectRoot,
      });
    });
  };

  describe.only('init (with skipGit)', () => {
    beforeInitTest({ skipGit: true });

    it('should not initialize a git repo if passed the skipGit option', async () => {
      expect(fs.existsSync(path.join(dir, '.git'))).toEqual(false);
    });
  });

  describe('init', () => {
    beforeInitTest();

    it('should fail in initializing an already initialized directory', async () => {
      await expect(api.init({ dir })).rejects.toThrow(
        `The specified path: "${dir}" is not empty.  Please ensure it is empty before initializing a new project`,
      );
    });

    it('should initialize an already initialized directory when forced to', async () => {
      await api.init({
        dir,
        force: true,
      });
    });

    it('should create a new folder with a npm module inside', async () => {
      expect(
        fs.existsSync(dir),
        'the target dir should have been created',
      ).toEqual(true);
      expect(fs.existsSync(path.join(dir, 'package.json'))).toEqual(true);
      expect(fs.existsSync(path.join(dir, '.git'))).toEqual(true);
      expect(
        fs.existsSync(path.resolve(dir, 'node_modules/electron')),
        'electron should exist',
      ).toEqual(true);
      expect(
        fs.existsSync(
          path.resolve(dir, 'node_modules/electron-squirrel-startup'),
        ),
        'electron-squirrel-startup should exist',
      ).toEqual(true);
      expect(
        fs.existsSync(path.resolve(dir, 'node_modules/@electron-forge/cli')),
        '@electron-forge/cli should exist',
      ).toEqual(true);
      expect(fs.existsSync(path.join(dir, 'forge.config.js'))).toEqual(true);
    });

    describe('lint', () => {
      it('should initially pass the linting process', () =>
        expectLintToPass(dir));
    });
  });

  describe.skip('init with CI files enabled', () => {
    beforeInitTest({ copyCIFiles: true });
    it.todo('should copy over the CI config files correctly');
  });

  describe.skip('init (with custom templater)', () => {
    beforeInitTest({
      template: path.resolve(__dirname, '../fixture/custom_init'),
    });

    it('should add custom dependencies', async () => {
      const packageJSON = await import(path.resolve(dir, 'package.json'));
      expect(packageJSON.dependencies).toHaveProperty('debug');
    });

    it('should add custom devDependencies', async () => {
      const packageJSON = await import(path.resolve(dir, 'package.json'));
      expect(packageJSON.devDependencies).toHaveProperty('lodash');
    });

    it('should create dot files correctly', async () => {
      expect(
        fs.existsSync(dir),
        'the target dir should have been created',
      ).toEqual(true);
      expect(fs.existsSync(path.join(dir, '.bar'))).toEqual(true);
    });

    it('should create deep files correctly', async () => {
      expect(fs.existsSync(path.join(dir, 'src/foo.js'))).toBe(true);
      expect(fs.existsSync(path.join(dir, 'src/index.html'))).toBe(true);
    });

    describe('lint', () => {
      it('should initially pass the linting process', () =>
        expectLintToPass(dir));
    });

    afterAll(async () => {
      await fs.promises.rm(dir, { recursive: true, force: true });
      execSync('npm unlink -g', {
        cwd: path.resolve(__dirname, '../fixture/custom_init'),
      });
    });
  });

  describe.skip('init (with a templater sans required Forge version)', () => {
    beforeAll(async () => {
      dir = await ensureTestDirIsNonexistent();

      return async () => {
        await fs.promises.rm(dir, { recursive: true, force: true });
      };
    });

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

  describe.skip('init (with a templater with a non-matching Forge version)', () => {
    beforeAll(async () => {
      dir = await ensureTestDirIsNonexistent();

      return async () => {
        await fs.promises.rm(dir, { recursive: true, force: true });
      };
    });

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

  describe.skip('init (with a nonexistent templater)', () => {
    beforeAll(async () => {
      dir = await ensureTestDirIsNonexistent();

      return async () => {
        await fs.promises.rm(dir, { recursive: true, force: true });
      };
    });

    it('should fail in initializing', async () => {
      await expect(
        api.init({
          dir,
          template: 'does-not-exist',
        }),
      ).rejects.toThrow('Failed to locate custom template');
    });
  });

  describe.skip('import', () => {
    beforeEach(async () => {
      dir = await ensureTestDirIsNonexistent();
      await fs.promises.mkdir(dir);
      execSync(
        `git clone https://github.com/electron/minimal-repro.git . --quiet`,
        {
          cwd: dir,
        },
      );

      return async () => {
        await fs.promises.rm(dir, { recursive: true, force: true });
      };
    });

    it('creates forge.config.js and can successfully package the application', async () => {
      await updatePackageJSON(dir, async (packageJSON) => {
        packageJSON.name = 'Name';
        packageJSON.productName = 'ProductName';
      });

      await api.import({ dir });

      expect(fs.existsSync(path.join(dir, 'forge.config.js'))).toEqual(true);

      await api.package({ dir });

      const outDirContents = fs.readdirSync(path.join(dir, 'out'));
      expect(outDirContents).toHaveLength(1);
      expect(outDirContents[0]).toEqual(
        `ProductName-${process.platform}-${process.arch}`,
      );
    });
  });
  let dir: string;
});
