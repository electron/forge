import path from 'path';
import { expect } from 'chai';

import { readRawPackageJson, readMutatedPackageJson } from '../../src/util/read-package-json';

describe('read-package-json', () => {
  describe('readRawPackageJson', () => {
    it('should find a package.json file from the given directory', async () => {
      expect(await readRawPackageJson(path.resolve(__dirname, '../..'))).to.deep.equal(require('../../package.json'));
    });
  });

  describe('readMutatedPackageJson', () => {
    it('should find a package.json file from the given directory', async () => {
      expect(await readMutatedPackageJson(
        path.resolve(__dirname, '../..'), {
          pluginInterface: {
            triggerMutatingHook: (_: any, pj: any) => Promise.resolve(pj),
          },
        } as any,
      )).to.deep.equal(require('../../package.json'));
    });

    it('should allow mutations from hooks', async () => {
      expect(await readMutatedPackageJson(
        path.resolve(__dirname, '../..'), {
          pluginInterface: {
            triggerMutatingHook: () => Promise.resolve('test_mut'),
          },
        } as any,
      )).to.deep.equal('test_mut');
    });
  });
});
