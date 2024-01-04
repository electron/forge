import path from 'path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { expect } from 'chai';

import getCurrentOutDir from '../../src/util/out-dir';

describe('out-dir', () => {
  const DIR = __dirname;

  describe('getCurrentOutDir', () => {
    it('resolves to the default out directory when nothing extra is declared', () => {
      expect(getCurrentOutDir(DIR, {} as ResolvedForgeConfig)).to.equal(`${DIR}${path.sep}out`);
    });

    it('resolves to the provided identifier', () => {
      expect(
        getCurrentOutDir(DIR, {
          buildIdentifier: 'bar',
        } as ResolvedForgeConfig)
      ).to.equal(`${DIR}${path.sep}out${path.sep}bar`);
    });

    it('resolves to the return value of provided identifier getter', () => {
      expect(
        getCurrentOutDir(DIR, {
          buildIdentifier: () => 'thing',
        } as ResolvedForgeConfig)
      ).to.equal(`${DIR}${path.sep}out${path.sep}thing`);
    });
  });
});

describe('out-dir-dist', () => {
  const DIR = __dirname;

  describe('getCurrentOutDir', () => {
    it('resolves to the dist directory when dist is declared', () => {
      expect(
        getCurrentOutDir(DIR, {
          outDir: 'dist',
        } as ResolvedForgeConfig)
      ).to.equal(`${DIR}${path.sep}dist`);
    });

    it('resolves to the provided identifier', () => {
      expect(
        getCurrentOutDir(DIR, {
          buildIdentifier: 'bar',
          outDir: 'dist',
        } as ResolvedForgeConfig)
      ).to.equal(`${DIR}${path.sep}dist${path.sep}bar`);
    });

    it('resolves to the return value of provided identifier getter', () => {
      expect(
        getCurrentOutDir(DIR, {
          buildIdentifier: () => 'thing',
          outDir: 'dist',
        } as ResolvedForgeConfig)
      ).to.equal(`${DIR}${path.sep}dist${path.sep}thing`);
    });
  });
});
