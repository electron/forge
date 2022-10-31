## Electron Forge

[![Build Status](https://github.com/electron/forge/workflows/CI/badge.svg)](https://github.com/electron/forge/actions?query=workflow:CI)
[![Discord](https://img.shields.io/discord/745037351163527189?color=blueviolet&logo=discord)](https://discord.com/invite/APGC3k5yaH)
[![npm version](https://img.shields.io/npm/v/@electron-forge/cli)](https://npm.im/@electron-forge/cli)
[![license](https://img.shields.io/github/license/electron/forge.svg)](https://github.com/electron/forge/blob/main/LICENSE)
![status](https://img.shields.io/badge/Status-%20Ready%20for%20Awesome-red.svg)

A complete tool for building modern Electron applications.

Electron Forge unifies the existing (and well maintained) build tools for
Electron development into a simple, easy to use package so that anyone can
jump right in to Electron development.

---

[Website](https://www.electronforge.io) |
[Goals](#project-goals) |
[Docs and Usage](#docs-and-usage) |
[Configuration](https://www.electronforge.io/configuration) |
[Support](https://github.com/electron/forge/blob/main/SUPPORT.md) |
[Contributing](https://github.com/electron/forge/blob/main/CONTRIBUTING.md) |
[Changelog](https://github.com/electron/forge/blob/main/CHANGELOG.md)

---

_Note: The major version bump between v5.0.0 and v6.0.0 contains major breaking API changes and improvements. If you are new to Forge, we highly recommend using the latest version. If using an older version of Forge, we recommend upgrading to v6.0.0 or later._

---

# Getting Started

Pre-requisities:

- Node 14.17.5 or higher
- Git

If you have a more recent version of `npm` or `yarn`, you can use
[`npx`](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b),
or
[`yarn create`](https://yarnpkg.com/blog/2017/05/12/introducing-yarn/).

```bash
npx create-electron-app my-new-app
# or
yarn create electron-app my-new-app

# then
cd my-new-app
npm start
```

Alternatively (less recommended):

```bash
npm install -g @electron-forge/cli
electron-forge init my-new-app
cd my-new-app
npm start
```

For more information on creating a new project from a template, [see our CLI documentation](https://www.electronforge.io/cli).

# Docs and Usage

For Electron Forge documentation and usage you should check out our website:
[electronforge.io](https://www.electronforge.io)

# Project Goals

1. Starting with Electron should be as simple as a single command.
2. Developers shouldn't have to worry about setting up build tooling,
   native module rebuilding, etc. Everything should "just work" for them out
   of the box.
3. Everything from creating the project to packaging the project for release
   should be handled by one core dependency in a standard way while still offering
   users maximum choice and freedom.

With these goals in mind, under the hood this project uses, among others:

- [`electron-rebuild`](https://github.com/electron/electron-rebuild):
  Automatically recompiles native Node.js modules against the correct
  Electron version.
- [Electron Packager](https://github.com/electron/electron-packager):
  Customizes and bundles your Electron app to get it ready for distribution.

## Contributing

If you are interested in reporting/fixing issues and contributing directly to the code base, please see [CONTRIBUTING.md](https://github.com/electron/forge/blob/main/CONTRIBUTING.md) for more information on what we're looking for and how to get started.

## Community

Please report bugs or feature requests in our [issue tracker](https://github.com/electron/forge/issues).
You can find help for debugging your Electron Forge on the [Support page](https://github.com/electron/forge/blob/main/SUPPORT.md), and ask questions in the [official Electron Discord server](https://discord.gg/invite/APGC3k5yaH), where there is a dedicated channel for Electron Forge.
