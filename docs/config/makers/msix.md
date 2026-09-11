---
description: >-
  Create a MSIX package that can be shipped as a direct download or to the Microsoft Store for your Electron app, using Electron
  Forge.
---

# MSIX

:::info

MSIX support was added in Electron Forge v7.10 and is currently **experimental**. Breaking changes to the configuration may be introduced between releases.

:::

The [MSIX](https://learn.microsoft.com/en-us/windows/msix/overview) target builds `.msix` packages, which can be directly distributed to end user or to the [Microsoft Store](https://apps.microsoft.com/home).

## Requirements

You can only build the MSIX target on Windows 10 or 11 machines with the [Windows SDK](https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/) installed. Check the [`electron-windows-msix` docs](https://github.com/bitdisaster/electron-windows-msix) for more information on platform requirements.

## Installation

```bash
npm install --save-dev @electron-forge/maker-msix
```

## Usage

To use `@electron-forge/maker-msix`, add it to the `makers` array in your [Forge configuration](../configuration.mdx):

```javascript title="forge.config.js"
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-msix',
      config: {
        manifestVariables: {
          publisher: 'Electron Dev'
        },
        windowsSignOptions: {
          certificateFile: 'C:\\devcert.pfx',
          certificatePassword: '122345'
        }
      }
    }
  ]
};
```

Configuration options are documented in [`MakerMSIXConfig`](https://js.electronforge.io/types/_electron_forge_maker_msix.MakerMSIXConfig.html).

For advanced code-signing use-cases, this maker utilizes @electron/windows-sign via the `windowsSignOptions` property. see the [windows-sign](https://github.com/electron/windows-sign/blob/main/README.md) README for more details.

## Debugging

For advanced debug logging for this maker, add the `DEBUG=electron-windows-msix*` environment variable
or set the `logLevel` to `debug` in the maker config.
