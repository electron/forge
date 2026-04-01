## Electron Forge

[![CI](https://github.com/electron/forge/actions/workflows/ci.yml/badge.svg)](https://github.com/electron/forge/actions/workflows/ci.yml)
[![Discord](https://img.shields.io/discord/745037351163527189?color=blueviolet&logo=discord)](https://discord.com/invite/APGC3k5yaH)
[![npm version](https://img.shields.io/npm/v/@electron-forge/cli)](https://npm.im/@electron-forge/cli)
[![license](https://img.shields.io/github/license/electron/forge.svg)](https://github.com/electron/forge/blob/main/LICENSE)
![status](https://img.shields.io/badge/Status-%20Ready%20for%20Awesome-red.svg)

> [!IMPORTANT]
> We're currently beginning feature development for the next major version of Electron Forge, which is being done in the [`next`](https://github.com/electron/forge/tree/next) branch.
> To try out experimental pre-releases, install the `@alpha` dist-tag of the `@electron-forge/*` packages via npm.
> For more details, see issue https://github.com/electron/forge/issues/4082.

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
[Contributing](https://github.com/electron/forge/blob/main/CONTRIBUTING.md)

---

# Getting Started

Pre-requisites:

- Node 16.4.0 or higher
- Git

You can initialize an Electron Forge project with the [`create-electron-app`](https://www.npmjs.com/package/create-electron-app)
CLI tool.

```bash
npx create-electron-app@latest my-new-app

# then
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

- [`@electron/rebuild`](https://github.com/electron/rebuild):
  Automatically recompiles native Node.js modules against the correct
  Electron version.
- [`@electron/packager`](https://github.com/electron/packager):
  Customizes and bundles your Electron app to get it ready for distribution.

## Contributing

If you are interested in reporting/fixing issues and contributing directly to the code base, please see [CONTRIBUTING.md](https://github.com/electron/forge/blob/main/CONTRIBUTING.md) for more information on what we're looking for and how to get started.

## Community

Please report bugs or feature requests in our [issue tracker](https://github.com/electron/forge/issues).
You can find help for debugging your Electron Forge on the [Support page](https://github.com/electron/forge/blob/main/SUPPORT.md), and ask questions in the [official Electron Discord server](https://discord.gg/invite/APGC3k5yaH), where there is a dedicated channel for Electron Forge.
