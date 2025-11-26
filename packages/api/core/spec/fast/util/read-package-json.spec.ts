import path from 'node:path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { describe, expect, it } from 'vitest';

import packageJSON from '../../../package.json';
import {
  readMutatedPackageJson,
  readRawPackageJson,
} from '../../../src/util/read-package-json.js';

describe('readRawPackageJson', () => {
  it('should find a package.json file from the given directory', async () => {
    const raw = await readRawPackageJson(path.resolve(__dirname, '../../../'));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expect(raw).toEqual(packageJSON);
  });
});

describe('readMutatedPackageJson', () => {
  it('should find a package.json file from the given directory', async () => {
    expect(
      await readMutatedPackageJson(path.resolve(__dirname, '../../../'), {
        pluginInterface: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          triggerMutatingHook: (_hookName: string, pj: any) =>
            Promise.resolve(pj),
        },
      } as unknown as ResolvedForgeConfig),
    ).toEqual(packageJSON);
  });

  it('should allow mutations from hooks', async () => {
    expect(
      await readMutatedPackageJson(path.resolve(__dirname, '../../../'), {
        pluginInterface: {
          triggerMutatingHook: () => Promise.resolve('test_mutation'),
        },
      } as unknown as ResolvedForgeConfig),
    ).toEqual('test_mutation');
  });
});
