---
description: >-
  Create an RPM package for RedHat-based Linux distributions for your Electron
  app, using Electron Forge.
---

# RPM

The RPM target builds `.rpm` files, which is the standard package format for Red Hat-based Linux distributions such as [Fedora](https://fedoraproject.org/) and [Red Hat Enterprise Linux](https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux) (RHEL).

## Requirements

You can only build the RPM target on Linux machines with the `rpm` or `rpm-build` packages installed.

On Fedora you can do something like this:

```shell
sudo dnf install rpm-build
```

While on Debian or Ubuntu you'll need to do this:

```shell
sudo apt-get install rpm
```

## Installation

```shell
npm install --save-dev @electron-forge/maker-rpm
```

## Usage

To use `@electron-forge/maker-rpm`, add it to the `makers` array in your [Forge configuration](../configuration.mdx):

```javascript title="forge.config.js"
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          homepage: 'http://example.com'
        }
      }
    }
  ]
};
```

Configuration options are documented in [`MakerRpmConfig`](https://js.electronforge.io/interfaces/\_electron\_forge\_maker\_rpm.MakerRpmConfig.html).

## Debugging

For advanced debug logging for this maker, add the `DEBUG=electron-installer-redhat*` environment variable.
