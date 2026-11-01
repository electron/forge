import webpack from 'webpack';
import { describe, expect, it } from 'vitest';

import { loadBundler } from '../../src/util/bundler';

describe('loadBundler', () => {
  it('uses webpack by default', async () => {
    const bundler = await loadBundler(undefined, process.cwd());
    expect(bundler.name).toEqual('webpack');
    expect(bundler.compile).toBe(webpack);
    expect(bundler.DefinePlugin).toBe(webpack.DefinePlugin);
  });

  // `@rspack/core` is deliberately not installed in this repo.
  it('explains how to install Rspack when it is missing', async () => {
    await expect(loadBundler('rspack', process.cwd())).rejects.toThrow(
      /"@rspack\/core" could not be loaded/,
    );
  });

  it('rejects an unknown bundler', async () => {
    await expect(
      loadBundler('parcel' as 'webpack', process.cwd()),
    ).rejects.toThrow(/Unknown bundler "parcel"/);
  });
});
