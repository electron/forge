import fs from 'node:fs';
import path from 'node:path';

import {
  ensureTestDirIsNonexistent,
  updatePackageJSON,
} from '@electron-forge/test-utils';
import { readMetadata } from 'electron-installer-common';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { api } from '../../src/api/index';
import { readRawPackageJson } from '../../src/util/read-package-json';

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
