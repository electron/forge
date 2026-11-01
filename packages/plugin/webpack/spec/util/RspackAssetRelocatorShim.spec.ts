import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { type Configuration, rspack } from '@rspack/core';
import { afterEach, describe, expect, it } from 'vitest';

import AssetRelocatorPatch from '../../src/util/AssetRelocatorPatch';
import RspackAssetRelocatorShim from '../../src/util/RspackAssetRelocatorShim';

const fixtureDir = path.resolve(
  import.meta.dirname,
  '../fixtures/rspack-relocator',
);

let outDir: string | undefined;

afterEach(() => {
  if (outDir) fs.rmSync(outDir, { recursive: true, force: true });
  outDir = undefined;
});

async function build(
  plugins: Configuration['plugins'],
  entry = './entry.cjs',
): Promise<string> {
  outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-rspack-shim-'));
  const compiler = rspack({
    mode: 'development',
    devtool: false,
    target: 'node',
    context: fixtureDir,
    entry,
    output: { path: outDir, filename: 'index.cjs', libraryTarget: 'commonjs2' },
    module: {
      rules: [
        {
          test: /entry\.cjs$/,
          use: path.join(fixtureDir, 'fake-relocator-loader.cjs'),
        },
      ],
    },
    plugins,
  });
  await new Promise<void>((resolve, reject) =>
    compiler.run((err, stats) => {
      if (err) return reject(err);
      if (stats?.hasErrors()) return reject(new Error(stats.toString()));
      compiler.close(() => resolve());
    }),
  );
  return fs.readFileSync(path.join(outDir, 'index.cjs'), 'utf8');
}

describe('RspackAssetRelocatorShim', () => {
  it('emits the loader code that sets __webpack_require__.ab', async () => {
    const code = await build([new RspackAssetRelocatorShim()]);
    expect(code).toContain(
      '__webpack_require__.ab = __dirname + "/native_modules/"',
    );
  });

  it('lets AssetRelocatorPatch rewrite the base path', async () => {
    const code = await build([
      new RspackAssetRelocatorShim(),
      new AssetRelocatorPatch(true, true),
    ]);
    expect(code).toContain(
      '__webpack_require__.ab = require("path").resolve(__dirname, "..") + "/native_modules/"',
    );
  });

  it('adds nothing when the loader is not used', async () => {
    const code = await build([new RspackAssetRelocatorShim()], './plain.cjs');
    expect(code).not.toContain('__webpack_require__.ab');
  });
});
