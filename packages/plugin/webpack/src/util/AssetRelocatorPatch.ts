import { Compiler } from 'webpack';

export default class AssetRelocatorPatch {
  readonly isProd: boolean;

  constructor(isProd: boolean) {
    this.isProd = isProd;
  }

  apply(compiler: Compiler) {
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
              const originalFn = tapInfo.fn;

              tapInfo.fn = (source: any, chunk: any) => {
                const originalInjectCode = originalFn(source, chunk) as string;

                // Since the is not a public API of the Vercel loader, it could
                // change on patch versions and break things.
                //
                // If the injected code changes substantially, we throw an error
                if (!originalInjectCode.includes("if (typeof __webpack_require__ !== 'undefined') __webpack_require__.ab = __dirname + ")) {
                  throw new Error('The installed version of @vercel/webpack-asset-relocator-loader does not appear to be compatible');
                }

                if (this.isProd) {
                  // In production, the native asset base is up one directory from
                  // __dirname.
                  //
                  // We use dirname(__filename) because there is a bug in
                  // html-webpack-plugin where it throws an error if the bundle
                  // contains __dirname 🤷‍♂️
                  return (
                    `const { dirname, resolve } = require('path');\n${
                      originalInjectCode.replace(
                        '__dirname',
                        "resolve(dirname(__filename), '..')",
                      )}`
                  );
                }

                // In development, the app is loaded via webpack-dev-server so
                // __dirname is useless because it points to Electron internal
                // code. Instead we just hard-code the absolute path to the webpack
                // output.
                return originalInjectCode.replace(
                  '__dirname',
                  JSON.stringify(compiler.options.output.path),
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
