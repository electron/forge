import type { Chunk, Compiler } from 'webpack';

const pluginName = 'asset-relocator-rebuild-patch';
const loaderTapName = 'asset-relocator-loader';

type RequireExtensionsFn = (
  source: string,
  chunk: Chunk,
  hash: string,
) => string;

/**
 * Keeps `__webpack_require__.ab` in bundles rebuilt in watch mode.
 *
 * `@vercel/webpack-asset-relocator-loader` sets `__webpack_require__.ab` (the
 * base path of relocated native modules and other assets) by tapping
 * `compilation.mainTemplate.hooks.requireExtensions` when it runs. Each
 * compilation has its own `mainTemplate`, and a watch rebuild reuses cached
 * modules without running their loaders. When none of the modules that go
 * through the loader changed, nothing taps the new compilation's hook, the
 * rebuilt bundle no longer sets `__webpack_require__.ab`, and requiring a
 * native module fails.
 *
 * This plugin remembers the loader's tap and adds it to later compilations
 * that the loader did not tap itself.
 */
export default class AssetRelocatorRebuildPatch {
  private loaderFn: RequireExtensionsFn | null = null;

  public apply(compiler: Compiler): void {
    // `thisCompilation` runs before `compilation`, where AssetRelocatorPatch
    // intercepts the same hook. Intercepting first means this plugin records
    // the loader's own function, not AssetRelocatorPatch's wrapper of it.
    // It also skips child compilations, which the loader does not tap.
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      const { requireExtensions } = compilation.mainTemplate.hooks;

      requireExtensions.intercept({
        register: (tapInfo) => {
          if (tapInfo.name === loaderTapName) {
            this.loaderFn = tapInfo.fn as RequireExtensionsFn;
          }
          return tapInfo;
        },
      });

      // Every module is built or restored from cache by `seal`, and webpack
      // checks whether the hook is used after it, when it adds runtime code.
      compilation.hooks.seal.tap(pluginName, () => {
        if (
          this.loaderFn &&
          !requireExtensions.taps.some((tap) => tap.name === loaderTapName)
        ) {
          requireExtensions.tap(loaderTapName, this.loaderFn);
        }
      });
    });
  }
}
