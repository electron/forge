---
description: Create a Flatpak app for your Electron app using Electron Forge.
---

# Flatpak

[Flatpak](https://flatpak.org/) is a packaging format for Linux distributions that allows for sandboxed installation of applications in isolation from the rest of their system. In contrast, typical [deb](deb.md) or [RPM](rpm.md) installation methods are not sandboxed.

## Requirements

You can only build the Flatpak target if you have the following installed on your system:

* [`flatpak`](https://docs.flatpak.org/en/latest/flatpak-command-reference.html#flatpak)
* [`flatpak-builder`](https://docs.flatpak.org/en/latest/flatpak-builder-command-reference.html#flatpak-builder)
* `eu-strip` _(usually part of the_ [_`elfutils`_](https://sourceware.org/elfutils/) _package)_

You will also need to add the Flathub remote repository to `flatpak` to access runtimes necessary to build your application:

```sh
flatpak remote-add --if-not-exists --user flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

:::info
Flathub provides separate [installation instructions](https://flathub.org/setup) for each supported Linux distribution. Please refer to their documentation for additional information.
:::

## Installation

```sh
npm install --save-dev @electron-forge/maker-flatpak
```

## Usage

To use `@electron-forge/maker-flatpak`, add it to the `makers` array in your [Forge configuration](../configuration.mdx):

```javascript
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-flatpak',
      config: {
        options: {
          categories: ['Video'],
          mimeType: ['video/h264']
        }
      }
    }
  ]
};
```

Configuration options are documented in [`MakerFlatpakConfig`](https://js.electronforge.io/interfaces/_electron_forge_maker_flatpak.MakerFlatpakConfig.html).

## Debugging

For advanced debug logging for this maker, add the `DEBUG=electron-installer-flatpak*` environment variable.
