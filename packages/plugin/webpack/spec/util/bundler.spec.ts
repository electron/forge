import { rspack } from '@rspack/core';
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

  it('loads Rspack when asked for', async () => {
    const bundler = await loadBundler('rspack', process.cwd());
    expect(bundler.name).toEqual('rspack');
    expect(bundler.compile).toBe(rspack);
    expect(bundler.DefinePlugin).toBe(rspack.DefinePlugin);
    expect(bundler.ExternalsPlugin).toBe(rspack.ExternalsPlugin);
  });

  it('rejects an unknown bundler', async () => {
    await expect(
      loadBundler('parcel' as 'webpack', process.cwd()),
    ).rejects.toThrow(/Unknown bundler "parcel"/);
  });
});
