import fs from 'node:fs';
import path from 'node:path';

import { ensureTestDirIsNonexistent } from '@electron-forge/test-utils';
import { readMetadata } from 'electron-installer-common';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { api } from '../../src/api/index';
import { readRawPackageJson } from '../../src/util/read-package-json';

type PackageJSON = Record<string, unknown> & {
  config?: {
    forge?: Record<string, unknown>;
  };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/**
 * Mutates the `package.json` file in a directory.
 * Use the return value to later restore the original `package.json` value
 * in a subsequent call of this function.
 *
 * @param dir - The target directory containing the `package.json` file
 * @param callback - A callback function that returns the value of the new `package.json` to be applied
 * @returns The original `package.json` prior to mutation
 */
async function updatePackageJSON(
  dir: string,
  callback: (packageJSON: PackageJSON) => Promise<PackageJSON>,
) {
  const packageJSON = await readRawPackageJson(dir);
  const mutated = await callback(JSON.parse(JSON.stringify(packageJSON)));
  await fs.promises.writeFile(
    path.resolve(dir, 'package.json'),
    JSON.stringify(mutated, null, 2),
    'utf-8',
  );
  return packageJSON;
}

describe('Package', () => {
  let outDir: string;
  beforeEach(async () => {
    outDir = await ensureTestDirIsNonexistent();

    return async () => {
      await fs.promises.rm(outDir, { recursive: true, force: true });
    };
  });

  it('can package an Electron app', async () => {
    const dir = path.resolve(__dirname, '..', 'fixture', 'default-app');

    expect(fs.existsSync(outDir)).toEqual(false);

    await api.package({ dir, outDir });

    // should respect outDir
    expect(fs.existsSync(outDir)).toEqual(true);

    // should remove Forge config from packaged app's package.json
    const cleanPackageJSON = await readMetadata({
      src: path.resolve(outDir, `Test-App-${process.platform}-${process.arch}`),
      logger: console.error,
    });
    expect(cleanPackageJSON).not.toHaveProperty('config.forge');

    // should leave the original Forge config intact
    const normalPackageJSON = await readRawPackageJson(dir);
    expect(normalPackageJSON).toHaveProperty('config.forge');
  });

  describe('with packagerConfig.all', () => {
    const dir = path.resolve(__dirname, '..', 'fixture', 'default-app');

    beforeAll(async () => {
      const original = await updatePackageJSON(dir, async (packageJSON) => {
        packageJSON.config = {
          forge: {
            packagerConfig: {
              all: true,
            },
          },
        };
        return packageJSON;
      });

      return async () => {
        await updatePackageJSON(dir, async (_packageJSON) => {
          return original;
        });
      };
    });

    it('throws an error when packagerConfig.all is set', async () => {
      const dir = path.resolve(__dirname, '..', 'fixture', 'default-app');
      await expect(api.package({ dir })).rejects.toThrow(
        /packagerConfig\.all is not supported by Electron Forge/,
      );
    });
  });

  describe('with prebuilt native module dependencies', () => {
    const dir = path.resolve(__dirname, '..', 'fixture', 'default-app');

    beforeAll(async () => {
      const original = await updatePackageJSON(dir, async (packageJSON) => {
        // add ref-napi from root workspace
        packageJSON.dependencies = {
          ...packageJSON.dependencies,
          'ref-napi': 'file:../../../../../../node_modules/ref-napi',
        };
        return packageJSON;
      });

      return async () => {
        await updatePackageJSON(dir, async (_packageJSON) => {
          return original;
        });
      };
    });

    beforeEach(async () => {
      outDir = await ensureTestDirIsNonexistent();

      return async () => {
        await fs.promises.rm(outDir, { recursive: true, force: true });
      };
    });

    it('can package without errors', async () => {
      await api.package({ dir, outDir });
    });
  });
});
