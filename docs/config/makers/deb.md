---
description: >-
  Create a package for Debian-based Linux distributions for your Electron app,
  using Electron Forge.
---

# deb

The deb target builds [`.deb` packages](https://www.debian.org/doc/manuals/debian-faq/pkg-basics.en.html), which are the standard package format for Debian-based Linux distributions such as [Ubuntu](https://ubuntu.com/).

## Requirements

You can only build the deb target on Linux or macOS machines with the [`fakeroot`](https://wiki.debian.org/FakeRoot) and [`dpkg`](https://wiki.debian.org/dpkg) packages installed.

## Installation

```bash
npm install --save-dev @electron-forge/maker-deb
```

## Usage

To use `@electron-forge/maker-deb`, add it to the `makers` array in your [Forge configuration](../configuration.mdx):

```javascript title="forge.config.js"
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Joe Bloggs',
          homepage: 'https://example.com'
        }
      }
    }
  ]
};
```

Configuration options are documented in [`MakerDebConfig`](https://js.electronforge.io/interfaces/\_electron\_forge\_maker\_deb.MakerDebConfig.html).

## Debugging

For advanced debug logging for this maker, add the `DEBUG=electron-installer-deb*` environment variable.
