import path from 'node:path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { describe, expect, it } from 'vitest';

import getCurrentOutDir from '../../../src/util/out-dir';

const DIR = __dirname;

describe('getCurrentOutDir', () => {
  it('resolves to the default out directory when nothing extra is declared', () => {
    const config = {} as ResolvedForgeConfig;
    expect(getCurrentOutDir(DIR, config)).toEqual(path.join(DIR, 'out'));
  });

  describe('buildIdentifier', () => {
    it('resolves to the buildIdentifier string', () => {
      const config = {
        buildIdentifier: 'bar',
      } as const;
      expect(getCurrentOutDir(DIR, config as ResolvedForgeConfig)).toEqual(path.join(DIR, 'out', config.buildIdentifier));
    });

    it('resolves to the return value of provided identifier getter', () => {
      const config = {
        buildIdentifier: () => 'thing',
      } as ResolvedForgeConfig;
      expect(getCurrentOutDir(DIR, config)).toEqual(path.join(DIR, 'out', 'thing'));
    });
  });

  describe('outDir', () => {
    it('resolves to the dist directory when dist is declared', () => {
      expect(
        getCurrentOutDir(DIR, {
          outDir: 'dist',
        } as ResolvedForgeConfig)
      ).toEqual(path.join(DIR, 'dist'));
    });

    it('resolves to outDir/buildIdentifier if both are active (string)', () => {
      expect(
        getCurrentOutDir(DIR, {
          buildIdentifier: 'bar',
          outDir: 'dist',
        } as ResolvedForgeConfig)
      ).toEqual(path.join(DIR, 'dist', 'bar'));
    });

    it('resolves to outDir/buildIdentifier if both are active (getter)', () => {
      expect(
        getCurrentOutDir(DIR, {
          buildIdentifier: () => 'thing',
          outDir: 'dist',
        } as ResolvedForgeConfig)
      ).toEqual(path.join(DIR, 'dist', 'thing'));
    });
  });
});
