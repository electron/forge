---
description: >-
  Create a package for the Microsoft Store for your Electron app, using Electron
  Forge.
---

# AppX

The AppX target builds `.appx` packages which are designed to target the [Microsoft Store](https://apps.microsoft.com/home).

## Requirements

You can only build the AppX target on Windows 10 or 11 machines with the [Windows SDK](https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/) installed. Check the [`electron-windows-store` docs](https://github.com/electron-userland/electron-windows-store) for more information on platform requirements.

## Installation

```bash
npm install --save-dev @electron-forge/maker-appx
```

## Usage

To use `@electron-forge/maker-appx`, add it to the `makers` array in your [Forge configuration](../configuration.mdx):

```javascript title="forge.config.js"
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-appx',
      config: {
        publisher: 'CN=developmentca',
        devCert: 'C:\\devcert.pfx',
        certPass: 'abcd'
      }
    }
  ]
};
```

Configuration options are documented in [`MakerAppXConfig`](https://js.electronforge.io/interfaces/\_electron\_forge\_maker\_appx.MakerAppXConfig.html).

## Debugging

For advanced debug logging for this maker, add the `DEBUG=electron-windows-store*` environment variable.
