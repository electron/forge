Electron Forge
--------------
[![Build Status](https://github.com/electron-userland/electron-forge/workflows/CI/badge.svg)](https://github.com/electron-userland/electron-forge/actions?query=workflow:CI)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm version](https://badge.fury.io/js/electron-forge.svg)](https://www.npmjs.com/package/electron-forge)
[![npm](https://img.shields.io/npm/dt/electron-forge.svg?maxAge=2592000)](https://www.npmjs.com/package/electron-forge)
[![license](https://img.shields.io/github/license/electron-userland/electron-forge.svg)](https://github.com/electron-userland/electron-forge/blob/master/LICENSE)
![status](https://img.shields.io/badge/Status-%20Ready%20for%20Awesome-red.svg)

A complete tool for building modern Electron applications.

Electron Forge unifies the existing (and well maintained) build tools for
Electron development into a simple, easy to use package so that anyone can
jump right in to Electron development.

----

## :rotating_light: :construction: **WARNING** :construction: :rotating_light:

:building_construction:

The `master` branch is a rewrite of Electron Forge that will eventually be the 6.x series. If you
are looking for the 5.x series (the version currently published to NPM under `electron-forge`), please view the [5.x branch](https://github.com/electron-userland/electron-forge/tree/5.x).

----

[Website](https://www.electronforge.io) |
[Goals](#project-goals) |
[Docs and Usage](#docs-and-usage) |
[Configuration](https://www.electronforge.io/configuration) |
[Support](https://github.com/electron-userland/electron-forge/blob/master/SUPPORT.md) |
[Contributing](https://github.com/electron-userland/electron-forge/blob/master/CONTRIBUTING.md) |
[Changelog](https://github.com/electron-userland/electron-forge/blob/master/CHANGELOG.md)

# Getting Started

**Note**: Electron Forge requires Node 10 or above, plus git installed.

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

# Project Goals

1. Starting with Electron should be as simple as a single command.
2. Developers shouldn't have to worry about setting up build tooling,
   native module rebuilding, etc.  Everything should "just work" for them out
   of the box.
3. Everything from creating the project to packaging the project for release
   should be handled by one core dependency in a standard way while still offering
   users maximum choice and freedom.

With these goals in mind, under the hood this project uses, among others:

* [`electron-rebuild`](https://github.com/electron/electron-rebuild):
  Automatically recompiles native Node.js modules against the correct
  Electron version.
* [Electron Packager](https://github.com/electron/electron-packager):
  Customizes and bundles your Electron app to get it ready for distribution.

# Docs and Usage

For Electron Forge documentation and usage you should check out our website:
[electronforge.io](https://www.electronforge.io)

# FAQ

## How do I use this with `webpack`/`babel`/`typescript`/other build tool?

By default, Electron Forge only runs vanilla (i.e., non-compiled) JavaScript, but for typescript, webpack, and other build tool support check out the [plugins](https://www.electronforge.io/config/plugins)
section of our docs site.  We currently have plugins for Webpack and Electron Compile, and a
[template for Webpack](https://www.electronforge.io/templates/webpack-template).

# Team

| <img src="https://s.gravatar.com/avatar/1576c987b53868acf73d6ccb08110a78?s=144" width="144" /> | <img src="https://avatars2.githubusercontent.com/u/11417?s=460&v=4" width="144" /> |
|---| --- |
| [Samuel Attard](https://samuelattard.com) | [Mark Lee](https://github.com/malept) |
