Electron Forge
--------------
[![Build Status](https://travis-ci.org/MarshallOfSound/electron-forge.svg?branch=master)](https://travis-ci.org/MarshallOfSound/electron-forge)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm version](https://badge.fury.io/js/electron-forge.svg)](https://www.npmjs.com/package/electron-forge)
[![npm](https://img.shields.io/npm/dt/electron-forge.svg?maxAge=2592000)](https://www.npmjs.com/package/electron-forge)
[![license](https://img.shields.io/github/license/MarshallOfSound/electron-forge.svg)](https://github.com/MarshallOfSound/electron-forge/blob/master/LICENSE)
![status](https://img.shields.io/badge/Status-%20Ready%20for%20Awesome-red.svg)

> The simple way to get started with Electron

# Getting Started

```bash
npm install -g electron-forge
electron-forge init my-new-app
cd my-new-app
electron-forge start
```

# Urgh, really...  Another build tool

Funnily enough, no :D.  This is not another build tool, `electron-forge` simply
unifies the existing (and well maintained) build tools for Electron development
into one, simple, easy to use package so that anyone can just jump right in
to Electron development.

# So what's the point

This project has a few main goals.

1. Starting with Electron should be as simple as a single command
2. Developers shouldn't have to worry about `babel`, `browserify`, `webpack` or
any of that nonsense.  Everything should just work for them out of the box.
3. Everything from creating the project to packaging the project for release
should be handled by one dependency in a standard way while still offering users
maximum choice and freedom.

With these goals in mind, under the hood this project uses
[`electron-compile`](https://github.com/electron/electron-compile): a tool
that lets you use modern and futuristic langauges inside Electron without
worrying about transpiling or build tooling.

# So go on then... How do I use the thing :)

Glad you asked, it's beyond easy to get started with `electron-forge`.

## Starting a new Project

```bash
npm install -g electron-forge
electron-forge init my-new-project
```

This command will generate you a brand new project folder and install all your NPM dependencies so you will be all set to go.  By default we will also install `airbnb` linting modules.  If you want to follow the `standard` linting rules instead use the `--lintstyle=standard` argument.

## Launching your Project

```bash
electron-forge start
```

Any args after "start" will be passed through to your application when it is launched.

## Packaging your Project

```bash
electron-forge package
```

Yes, it really is that simple.  If you want to specify platform / arch, use the
`--platform=<platform>` and `--arch=<arch>` arguments.

## Generating a distributable for your Project

```bash
electron-forge make
```

This will generate platform specific distributables for you.  Note you can only generate distributables for your current platform.

## Linting your Project

```bash
electron-forge lint
```

# Config

Once you have generated a project your `package.json` file will have some default `forge` config.  Below is the reference structure for this config object.

```javascript
{
  "make_targets": {
    "win32": ["squirrel"], // An array of win32 make targets
    "darwin": ["zip", "dmg"], // An array of darwin make targets
    "linux": ["deb", "rpm", "flatpak"] // An array of linux make targets
  },
  "electronPackagerConfig": {},
  "electronWinstallerConfig": {},
  "electronInstallerDMG": {},
  "electronInstallerFlatpak": {},
  "electronInstallerDebian": {},
  "electronInstallerRedhat": {}
}
```

## Possible `make` targets

| Target Name | Available Platforms | Description | Configurable Options | Default? | Requirements |
|-------------|---------------------|-------------|----------------------|----------|--------------|
| `zip`       | All                 | Zips your packaged application | None | Yes | `zip` on Darwin/Linux |
| `squirrel`  | Windows             | Generates an installer and `.nupkg` files for Squirrel.Windows | [`electronWinstallerConfig`](https://github.com/electron/windows-installer#usage) | Yes |  |
| `dmg`       | Darwin              | Generates a DMG file | [`electronInstallerDMG`](https://github.com/mongodb-js/electron-installer-dmg#api) | No |  |
| `deb`       | Linux               | Generates a Debian installer | [`electronInstallerDebian`](https://github.com/unindented/electron-installer-debian#options) | Yes | [`fakeroot` and `dpkg`](https://github.com/unindented/electron-installer-debian#requirements) |
| `rpm`       | Linux               | Generates a Redhat installer | [`electronInstallerRedhat`](https://github.com/unindented/electron-installer-redhat#options) | Yes | [`rpm`](https://github.com/unindented/electron-installer-redhatn#requirements) |
| `flatpak`   | Linux               | Generates a `flatpak` file | [`electronInstallerFlatpak`](https://github.com/endlessm/electron-installer-flatpak#options) | No | [`flatpak-builder`](https://github.com/endlessm/electron-installer-flatpak#requirements) |

## Configuring `package`

You can set `electronPackagerConfig` with **any** of the options from [Electron Packager](https://github.com/electron-userland/electron-packager/blob/master/docs/api.md).

**NOTE:** The `afterCopy` and `afterExtract` are mapped to `require` calls internally so provide a path to a file that exports your hooks and they will still run.
