## plugin-webpack

This plugin makes it easy to set up standard webpack tooling to compile both your main process code and your renderer process code, with built-in support for Hot Module Replacement (HMR) in the renderer process and support for multiple renderers.

```javascript
// forge.config.js

module.exports = {
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [{
            name: 'main_window',
            html: './src/renderer/index.html',
            js: './src/renderer/index.js',
            preload: {
              js: './src/preload.js'
            }
          }]
        }
      }
    }
  ]
};
```

### Rspack

To build with [Rspack](https://rspack.rs) instead of webpack, install `@rspack/core` in your app and set `bundler: 'rspack'` in the plugin config. Rspack is an optional peer dependency, so it is never installed unless you add it yourself. `@vercel/webpack-asset-relocator-loader` does not work with Rspack, so native Node modules are not supported in Rspack mode yet.
