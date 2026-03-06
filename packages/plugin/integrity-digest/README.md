## @electron-forge/plugin-integrity-digest

This plugin provides a `packageAfterCopy` hook for calculating and storing integrity digests when packaging with Electron Forge.

### Usage

Install `@electron-forge/plugin-integrity-digest` and add this plugin to the `plugins` array in your Forge configuration:

```shell
# Yarn
yarn add --dev @electron-forge/plugin-integrity-digest

# npm
npm i -D @electron-forge/plugin-integrity-digest
```

```js
// forge.config.js

const { IntegrityDigestPlugin } = require('@electron-forge/plugin-integrity-digest');

const forgeConfig = {
  plugins: [new IntegrityDigestPlugin()],
};

module.exports = forgeConfig;
```

If desired, you can pass a specific version of integrity digest to calculate and store. Currently, the only version is `1`.

```js
const forgeConfig = {
  plugins: [new IntegrityDigestPlugin({version: 1})],
};
```