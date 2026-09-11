---
description: Integrate a local build of Electron into your Forge app.
---

# Local Electron Plugin

:::info
This plugin should only be used by people who are building Electron locally themselves. If you want to use a fork of Electron, check out the [environment variables](https://github.com/electron/get#usage) you can use to configure `@electron/get`.
:::

This plugin allows you to both run and build your app using a **local** build of Electron. This can be incredibly useful if you want to test a feature or a bug fix in your app before making a PR up to the Electron repository.

If you want to set up a local build of Electron, you should check out [Electron Build Tools](https://github.com/electron/build-tools).

### Installation

```bash
npm install --save-dev @electron-forge/plugin-local-electron
```

### Usage

Once you have a working build of Electron, point the plugin's `electronPath` config option to the folder containing the built Electron binary.

All possible configuration options are documented in [`LocalElectronPluginConfig`](https://js.electronforge.io/interfaces/\_electron\_forge\_plugin\_local\_electron.LocalElectronPluginConfig.html).

```javascript title="forge.config.js"
{
  plugins: [
    {
      name: '@electron-forge/plugin-local-electron',
      config: {
        electronPath: '/Users/me/projects/electron/out/Testing'
      }
    }
  ]
}
```

:::info
Please note that the plugin only accepts **absolute paths**. You should use Node's [`path.resolve()`](https://nodejs.org/api/path.html#pathresolvepaths) to make things deterministic.
:::
