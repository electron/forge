import path from 'path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { expect } from 'chai';

import { readMutatedPackageJson, readRawPackageJson } from '../../src/util/read-package-json';

const emptyForgeConfig: Partial<ResolvedForgeConfig> = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [],
  publishers: [],
  plugins: [],
};

describe('read-package-json', () => {
  describe('readRawPackageJson', () => {
    it('should find a package.json file from the given directory', async () => {
      expect(await readRawPackageJson(path.resolve(__dirname, '../..'))).to.deep.equal(require('../../package.json'));
    });
  });

  describe('readMutatedPackageJson', () => {
    it('should find a package.json file from the given directory', async () => {
      expect(
        await readMutatedPackageJson(path.resolve(__dirname, '../..'), {
          ...emptyForgeConfig,
          pluginInterface: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            triggerMutatingHook: (_hookName: string, pj: any) => Promise.resolve(pj),
            triggerHook: () => Promise.resolve(),
            overrideStartLogic: () => Promise.resolve(false),
            getHookListrTasks: () => Promise.resolve([]),
          },
        } as ResolvedForgeConfig)
      ).to.deep.equal(require('../../package.json'));
    });

    it('should allow mutations from hooks', async () => {
      expect(
        await readMutatedPackageJson(path.resolve(__dirname, '../..'), {
          ...emptyForgeConfig,
          pluginInterface: {
            triggerMutatingHook: () => Promise.resolve('test_mut'),
            triggerHook: () => Promise.resolve(),
            overrideStartLogic: () => Promise.resolve(false),
            getHookListrTasks: () => Promise.resolve([]),
          },
        } as ResolvedForgeConfig)
      ).to.deep.equal('test_mut');
    });
  });
});
