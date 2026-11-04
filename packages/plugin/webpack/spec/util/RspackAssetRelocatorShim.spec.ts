import { describe, expect, it } from 'vitest';

import AssetRelocatorPatch from '../../src/util/AssetRelocatorPatch';
import RspackAssetRelocatorShim from '../../src/util/RspackAssetRelocatorShim';

// `@rspack/core` is deliberately not installed in this repo, so these tests
// drive the shim through a minimal stand-in for Rspack's compiler API.

type Fn = (...args: any[]) => any;

class FakeRuntimeModule {
  static STAGE_ATTACH = 10;

  constructor(
    public name: string,
    public stage: number,
  ) {}

  generate(): string {
    return '';
  }
}

function createFakeCompiler() {
  const compilationTaps: { stage: number; fn: Fn }[] = [];
  const compiler = {
    webpack: { RuntimeModule: FakeRuntimeModule },
    options: { output: { path: '/out/renderer' } },
    hooks: {
      compilation: {
        tap: (options: string | { stage?: number }, fn: Fn) => {
          const stage = typeof options === 'string' ? 0 : (options.stage ?? 0);
          compilationTaps.push({ stage, fn });
          compilationTaps.sort((a, b) => a.stage - b.stage);
        },
      },
    },
  };

  const compile = (runLoader: boolean, { child = false } = {}) => {
    const runtimeRequirementTaps: Fn[] = [];
    const runtimeModules: FakeRuntimeModule[] = [];
    const compilation: any = {
      compiler: child ? { name: 'child' } : compiler,
      hooks: {
        additionalTreeRuntimeRequirements: {
          tap: (_: string, fn: Fn) => runtimeRequirementTaps.push(fn),
        },
      },
      addRuntimeModule: (_chunk: unknown, mod: FakeRuntimeModule) =>
        runtimeModules.push(mod),
    };
    for (const { fn } of compilationTaps) fn(compilation);
    if (runLoader) fakeRelocatorLoader(compilation);
    const chunk = { name: 'main_window/index' };
    for (const fn of runtimeRequirementTaps) fn(chunk, new Set());
    return runtimeModules.map((mod) => mod.generate()).join('\n');
  };

  return { compiler, compile };
}

// Mimics how @vercel/webpack-asset-relocator-loader sets __webpack_require__.ab.
const hooked = new WeakSet();
function fakeRelocatorLoader(compilation: any) {
  const { mainTemplate } = compilation;
  if (hooked.has(mainTemplate)) return;
  hooked.add(mainTemplate);
  mainTemplate.hooks.requireExtensions.tap(
    'asset-relocator-loader',
    (source: string) =>
      `${source}\n__webpack_require__.ab = __dirname + "/native_modules/";`,
  );
}

describe('RspackAssetRelocatorShim', () => {
  it('emits the loader code as a runtime module', () => {
    const { compiler, compile } = createFakeCompiler();
    new RspackAssetRelocatorShim().apply(compiler as any);
    expect(compile(true)).toContain(
      '__webpack_require__.ab = __dirname + "/native_modules/"',
    );
  });

  it('adds nothing when the loader does not run', () => {
    const { compiler, compile } = createFakeCompiler();
    new RspackAssetRelocatorShim().apply(compiler as any);
    expect(compile(false)).toEqual('');
  });

  it('replays the loader code in a rebuild that skips the loader', () => {
    const { compiler, compile } = createFakeCompiler();
    new RspackAssetRelocatorShim().apply(compiler as any);
    compile(true);
    const rebuilt = compile(false);
    expect(rebuilt).toContain('__webpack_require__.ab = __dirname');
    expect(rebuilt.match(/__webpack_require__\.ab/g)).toHaveLength(1);
  });

  it('does not run the loader code twice when the loader runs again', () => {
    const { compiler, compile } = createFakeCompiler();
    new RspackAssetRelocatorShim().apply(compiler as any);
    compile(true);
    expect(compile(true).match(/__webpack_require__\.ab/g)).toHaveLength(1);
  });

  it('gives child compilations the hook without sharing taps', () => {
    const { compiler, compile } = createFakeCompiler();
    new RspackAssetRelocatorShim().apply(compiler as any);
    // A child compilation that runs the loader gets the hook...
    expect(compile(true, { child: true })).toContain(
      '__webpack_require__.ab = __dirname',
    );
    // ...but its tap is not replayed into the next top-level compilation.
    expect(compile(false)).toEqual('');
  });

  it('runs ahead of AssetRelocatorPatch whatever the plugin order', () => {
    const { compiler, compile } = createFakeCompiler();
    new AssetRelocatorPatch(true, true).apply(compiler as any);
    new RspackAssetRelocatorShim().apply(compiler as any);
    expect(compile(true)).toContain(
      'require("path").resolve(__dirname, "..") + "/native_modules/"',
    );
  });

  it('lets AssetRelocatorPatch rewrite the base path', () => {
    const { compiler, compile } = createFakeCompiler();
    new RspackAssetRelocatorShim().apply(compiler as any);
    new AssetRelocatorPatch(true, true).apply(compiler as any);
    expect(compile(true)).toContain(
      '__webpack_require__.ab = require("path").resolve(__dirname, "..") + "/native_modules/"',
    );
  });

  it('lets AssetRelocatorPatch hard-code the output path in development', () => {
    const { compiler, compile } = createFakeCompiler();
    new RspackAssetRelocatorShim().apply(compiler as any);
    new AssetRelocatorPatch(false, true).apply(compiler as any);
    compile(true);
    expect(compile(false)).toContain(
      '__webpack_require__.ab = "/out/renderer" + "/native_modules/"',
    );
  });
});
