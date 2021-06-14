import { Chunk, Compiler } from 'webpack';

export default class AssetRelocatorPatch {
  private readonly isProd: boolean;

  constructor(isProd: boolean) {
    this.isProd = isProd;
  }

  public apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(
      'asset-relocator-forge-patch',
      (compilation) => {
        // We intercept the Vercel loader code injection and replace __dirname with
        // code that works with Electron Forge
        //
        // Here is where the injection occurs:
        // https://github.com/vercel/webpack-asset-relocator-loader/blob/4710a018fc8fb64ad51efb368759616fb273618f/src/asset-relocator.js#L331-L339
        compilation.mainTemplate.hooks.requireExtensions.intercept({
          register: (tapInfo) => {
            if (tapInfo.name === 'asset-relocator-loader') {
              const originalFn = tapInfo.fn as (source: string, chunk: Chunk) => string;

              tapInfo.fn = (source: string, chunk: Chunk) => {
                const originalInjectCode = originalFn(source, chunk);

                // Since the is not a public API of the Vercel loader, it could
                // change on patch versions and break things.
                //
                // If the injected code changes substantially, we throw an error
                if (!originalInjectCode.includes('__webpack_require__.ab = __dirname + ')) {
                  throw new Error('The installed version of @vercel/webpack-asset-relocator-loader does not appear to be compatible with Forge');
                }

                return originalInjectCode.replace(
                  '__dirname',
                  this.isProd
                  // In production the assets are found one directory up from __dirname
                    ? 'require("path").resolve(require("path").dirname(__filename), "..")'
                  // In development, the app is loaded via webpack-dev-server
                  // so __dirname is useless because it points to Electron
                  // internal code. Instead we hard-code the absolute path to
                  // the webpack output.
                    : JSON.stringify(compiler.options.output.path),
                );
              };
            }

            return tapInfo;
          },
        });
      },
    );
  }
}
