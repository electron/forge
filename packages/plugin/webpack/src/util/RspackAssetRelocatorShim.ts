import type { Chunk, Compiler } from 'webpack';

const pluginName = 'RspackAssetRelocatorShim';

type RequireExtensionsFn = (source: string, chunk: Chunk) => string;

interface TapInfo {
  name: string;
  fn: RequireExtensionsFn;
}

interface Interceptor {
  register?: (tapInfo: TapInfo) => TapInfo;
}

/**
 * The part of webpack's `SyncWaterfallHook` that the asset relocator loader
 * and {@link AssetRelocatorPatch} use.
 */
class RequireExtensionsHook {
  private taps: TapInfo[] = [];

  private interceptors: Interceptor[] = [];

  constructor(private readonly onTap: (tapInfo: TapInfo) => void) {}

  tap(options: string | { name: string }, fn: RequireExtensionsFn): void {
    const name = typeof options === 'string' ? options : options.name;
    this.onTap({ name, fn });
    let tapInfo: TapInfo = { name, fn };
    for (const interceptor of this.interceptors) {
      if (interceptor.register) tapInfo = interceptor.register(tapInfo);
    }
    // A tap with the same name replaces the earlier one, so a loader that
    // taps again in a later compilation does not run twice.
    this.taps = this.taps.filter((t) => t.name !== name).concat(tapInfo);
  }

  intercept(interceptor: Interceptor): void {
    this.interceptors.push(interceptor);
    if (interceptor.register) {
      this.taps = this.taps.map((tapInfo) => interceptor.register!(tapInfo));
    }
  }

  isUsed(): boolean {
    return this.taps.length > 0;
  }

  call(source: string, chunk: Chunk): string {
    return this.taps.reduce((acc, tapInfo) => tapInfo.fn(acc, chunk), source);
  }
}

/**
 * Let `@vercel/webpack-asset-relocator-loader` run under Rspack.
 *
 * The loader works under Rspack except for one webpack internal: it sets
 * `__webpack_require__.ab` (the base path of relocated native modules and
 * other assets) through `compilation.mainTemplate.hooks.requireExtensions`,
 * which Rspack does not have. This plugin gives each compilation a stand-in
 * `mainTemplate` with that hook, and emits whatever code is tapped into it as
 * a runtime module, which is where webpack would have put it.
 *
 * {@link AssetRelocatorPatch} intercepts the same hook, so it keeps working.
 *
 * The loader only taps the hook when it runs, and in watch mode a rebuild can
 * reuse cached modules without running it. The shim remembers the loader's
 * taps and replays them into every later compilation, so a rebuild still sets
 * `__webpack_require__.ab`.
 */
export default class RspackAssetRelocatorShim {
  private readonly knownTaps = new Map<string, RequireExtensionsFn>();

  apply(compiler: Compiler): void {
    // Rspack's compiler exposes its own exports as `compiler.webpack`.
    const { RuntimeModule } = compiler.webpack;

    // `compilation` also fires for child compilations (such as
    // html-webpack-plugin's template build), which can run the loader too.
    // The early stage keeps this ahead of AssetRelocatorPatch, which looks for
    // the hook in its own `compilation` tap.
    compiler.hooks.compilation.tap(
      { name: pluginName, stage: -100 },
      (compilation) => {
        if (compilation.mainTemplate) return;

        // Only replay taps within the top-level compilations of this
        // compiler. A child compilation runs the loader itself when it needs
        // it.
        const isChild = compilation.compiler !== compiler;
        const requireExtensions = new RequireExtensionsHook(({ name, fn }) => {
          if (!isChild) this.knownTaps.set(name, fn);
        });
        if (!isChild) {
          for (const [name, fn] of this.knownTaps) {
            requireExtensions.tap(name, fn);
          }
        }
        Object.defineProperty(compilation, 'mainTemplate', {
          configurable: true,
          value: { hooks: { requireExtensions } },
        });

        compilation.hooks.additionalTreeRuntimeRequirements.tap(
          pluginName,
          (chunk) => {
            // The loader taps the hook the first time it runs, so there is
            // nothing to add for bundles that do not use it.
            if (!requireExtensions.isUsed()) return;

            class AssetRelocatorBaseRuntimeModule extends RuntimeModule {
              constructor() {
                super('asset-relocator-base', RuntimeModule.STAGE_ATTACH);
              }

              generate(): string {
                return requireExtensions.call('', chunk);
              }
            }

            compilation.addRuntimeModule(
              chunk,
              new AssetRelocatorBaseRuntimeModule(),
            );
          },
        );
      },
    );
  }
}
