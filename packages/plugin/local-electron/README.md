## plugin-local-electron

This plugin allows you to both run and build your app using a local build of Electron. This can be incredibly useful if you want to test a feature or a bug fix in your app before making a PR up to the Electron repository.

_Note: This plugin should only be used by people who are building Electron locally themselves. If you want to set up a local build of Electron, you should check out [Electron Build Tools](https://github.com/electron/build-tools)._

```
// forge.config.js

{
    name: '@electron-forge/plugin-local-electron',
    config: {
    electronPath: '/Users/me/projects/electron/out/Testing',
    },
},
```