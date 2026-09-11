---
description: Create an MSI file for your Electron app on Windows using Electron Forge.
---

# WiX MSI

The WiX MSI target builds `.msi` files, which are "traditional" Windows installer files.

:::warning
We generally recommend using the [Squirrel.Windows](squirrel.windows.md) target over using this one. These MSI files are a worse user experience for installation but sometimes it is necessary to build MSI files to appease large-scale enterprise companies with internal application distribution policies.
:::

## Requirements

You can only build the WiX MSI target on machines with [WiX Toolset v3](https://wixtoolset.org/docs/wix3/) installed. We recommend pinning your installation of WiX Toolset to a specific version. You can install WiX Toolset on Windows via [Chocolatey](https://chocolatey.org/).

```bash
choco install wixtoolset  --version=3.14.0
```

## Installation

```bash
npm install --save-dev @electron-forge/maker-wix
```

## Usage

To use `@electron-forge/maker-wix`, add it to the `makers` array in your [Forge configuration](../configuration.mdx):

```javascript
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-wix',
      config: {
        language: 1033,
        manufacturer: 'My Awesome Company'
      }
    }
  ]
};
```

Configuration options are documented in [`MakerWixConfig`](https://js.electronforge.io/interfaces/\_electron\_forge\_maker\_wix.MakerWixConfig.html).

### Debugging

For advanced debug logging for this maker, add the `DEBUG=electron-wix-msi*` environment variable.
