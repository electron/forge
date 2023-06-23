## @electron-forge/plugin-fuses

This plugin allows flipping [Electron Fuses](https://github.com/electron/fuses) when packaging your app with Electron Forge.

### Usage

Install `@electron-forge/plugin-fuses` and `@electron/fuses` as dev dependencies and add this plugin to the `plugins` array in your Forge configuration:

```shell
# Yarn
yarn add --dev @electron-forge/plugin-fuses @electron/fuses

# npm
npm i -D @electron-forge/plugin-fuses @electron/fuses
```

```js
// forge.config.js

const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const forgeConfig = {
  plugins: [
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false
      // ...any other options supported by @electron/fuses
    })
  ]
};

module.exports = forgeConfig;
```
