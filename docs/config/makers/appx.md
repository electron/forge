---
description: >-
  Create a package for the Microsoft Store for your Electron app, using Electron
  Forge.
---

# AppX (legacy)

:::warning

`@electron-forge/maker-appx` is **deprecated**. New projects should use the [MSIX maker](msix.md) instead.

Since Electron Forge v8, this maker is a compatibility layer over the MSIX maker: it no longer depends on `electron-windows-store` and produces a `.msix` file (not `.appx`) in `make/appx/<arch>/`. Your existing `MakerAppXConfig` keeps working with these differences:

- The `containerVirtualization`, `createConfigParams`, `createPriParams`, `deploy`, `desktopConverter`, `expandedBaseImage`, `flatten`, `finalSay` and `makeappxParams` options have no MSIX equivalent and are ignored with a warning.
- When `devCert` is not set, `electron-windows-msix` signs the package with a self-signed development certificate, which the maker saves next to the `.msix` as `dev_cert.cer` and `dev_cert.pfx` so it can be trusted on a test device. The `.pfx` password is `WINDOWS_CERTIFICATE_PASSWORD` when that environment variable is set, otherwise a random one.
- A missing `publisher` (no `publisher` option and no `author.name` in `package.json`) is now an error.

:::

The AppX target builds packages which are designed to target the [Microsoft Store](https://apps.microsoft.com/home).

## Requirements

You can only build the AppX target on Windows 10 or 11 machines with the [Windows SDK](https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/) installed. Check the [`electron-windows-msix` docs](https://github.com/bitdisaster/electron-windows-msix) for more information on platform requirements.

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

For advanced debug logging for this maker, add the `DEBUG=electron-windows-msix*` environment variable.
