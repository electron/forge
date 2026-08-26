## plugin-vite

_Note: This plugin is considered experimental and is under active development; we do not offer API stability guarantees as development continues. Minor versions may include breaking changes - see release notes for details on migration._

This plugin makes it easy to set up standard vite tooling to compile both your main process code and your renderer process code, with built-in support for Hot Module Replacement (HMR) in the renderer process and support for multiple renderers.

```javascript
// forge.config.js

module.exports = {
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/main.js',
            config: 'vite.main.config.mjs'
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs'
          }
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs'
          }
        ]
      }
    }
  ]
};
```

### Main process hot restart

Renderer code is hot-reloaded by Vite out of the box, but main process code is
not: the app has to be relaunched to pick it up. Set `hotRestart` to have
`electron-forge start` do that for you whenever a main process bundle rebuilds:

```javascript
// forge.config.js

module.exports = {
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        hotRestart: true,
        build: [
          {
            entry: 'src/main.js',
            config: 'vite.main.config.mjs'
          }
        ],
        renderer: []
      }
    }
  ]
};
```

This is off by default, so main process changes otherwise only take effect when
you type `rs` in the terminal or restart `electron-forge start`. The option has
no effect when packaging.
