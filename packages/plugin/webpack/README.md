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
