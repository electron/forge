---
description: Create a Snap package for your Electron app using Electron Forge.
---

# Snapcraft

The [Snapcraft](https://snapcraft.io/) target builds `.snap` files, which is the packaging format created and sponsored by Canonical, the company behind Ubuntu. It is a sandboxed package format that lets users of various Linux distributions install your application in an isolated environment on their machine.

## Requirements

You can only build the Snapcraft target on Linux systems with the [`snapcraft`](https://snapcraft.io/) package installed.

## Installation

```bash
npm install --save-dev @electron-forge/maker-snap
```

## Usage

To use `@electron-forge/maker-snap`, add it to the `makers` array in your [Forge configuration](../configuration.mdx):

```javascript title="forge.config.js"
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-snap',
      config: {
        features: {
          audio: true,
          mpris: 'com.example.mpris',
          webgl: true
        },
        summary: 'Pretty Awesome'
      }
    }
  ]
};
```

Configuration options are documented in [`MakerSnapConfig`](https://js.electronforge.io/types/_electron_forge_maker_snap.MakerSnapConfig.html).

## Debugging

For advanced debug logging for this maker, add the `DEBUG=electron-installer-snap*` environment variable.
