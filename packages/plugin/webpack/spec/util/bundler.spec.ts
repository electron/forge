import { rspack } from '@rspack/core';
import webpack from 'webpack';
import { describe, expect, it } from 'vitest';

import { assertRspackCompatible, loadBundler } from '../../src/util/bundler';

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

describe('assertRspackCompatible', () => {
  const relocator = '@vercel/webpack-asset-relocator-loader';

  it('allows configs without incompatible loaders', () => {
    expect(() =>
      assertRspackCompatible({
        module: {
          rules: [
            { test: /\.tsx?$/, use: { loader: 'ts-loader' } },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
          ],
        },
      }),
    ).not.toThrow();
    expect(() => assertRspackCompatible({})).not.toThrow();
  });

  it.each([
    ['use object', { use: { loader: relocator } }],
    ['use string', { use: relocator }],
    ['loader', { loader: relocator }],
    ['use array', { use: ['other-loader', { loader: relocator }] }],
    ['oneOf', { oneOf: [{ use: relocator }] }],
    ['nested rules', { rules: [{ loader: relocator }] }],
    [
      'resolved path',
      { loader: `/app/node_modules/${relocator}/dist/index.js` },
    ],
  ])('rejects the asset relocator loader given as %s', (_, rule) => {
    expect(() => assertRspackCompatible({ module: { rules: [rule] } })).toThrow(
      /does not work with Rspack/,
    );
  });
});
