import { ForgeConfig } from '@electron-forge/shared-types';
import { expect } from 'chai';
import path from 'path';

import getCurrentOutDir from '../../src/util/out-dir';

describe('out-dir', () => {
  const DIR = __dirname;

  describe('getCurrentOutDir', () => {
    it('resolves to the default out directory when nothing extra is declared', () => {
      expect(getCurrentOutDir(DIR, {} as ForgeConfig)).to.equal(`${DIR}${path.sep}out`);
    });

    it('resolves to the provided identifier', () => {
      expect(
        getCurrentOutDir(DIR, {
          buildIdentifier: 'bar',
        } as ForgeConfig)
      ).to.equal(`${DIR}${path.sep}out${path.sep}bar`);
    });

    it('resolves to the return value of provided identifier getter', () => {
      expect(
        getCurrentOutDir(DIR, {
          buildIdentifier: () => 'thing',
        } as ForgeConfig)
      ).to.equal(`${DIR}${path.sep}out${path.sep}thing`);
    });
  });
});
