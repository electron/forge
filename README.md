Electron Forge
--------------
[![Linux/macOS Build Status](https://travis-ci.org/electron-userland/electron-forge.svg?branch=5.x)](https://travis-ci.org/electron-userland/electron-forge)
[![Windows Build status](https://ci.appveyor.com/api/projects/status/79ae80nek1eucyy3/branch/5.x?svg=true)](https://ci.appveyor.com/project/electron-userland/electron-forge)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm version](https://badge.fury.io/js/electron-forge.svg)](https://www.npmjs.com/package/electron-forge)
[![npm](https://img.shields.io/npm/dt/electron-forge.svg?maxAge=2592000)](https://www.npmjs.com/package/electron-forge)
[![license](https://img.shields.io/github/license/electron-userland/electron-forge.svg)](https://github.com/electron-userland/electron-forge/blob/5.x/LICENSE)
![status](https://img.shields.io/badge/Status-%20Ready%20for%20Awesome-red.svg)

A complete tool for building modern Electron applications.

Electron Forge unifies the existing (and well maintained) build tools for
Electron development into a simple, easy to use package so that anyone can
jump right in to Electron development.

----

[Website](https://electronforge.io) |
[Goals](#project-goals) |
[Usage](#usage) |
[Configuration](#config) |
[Support](https://github.com/electron-userland/electron-forge/blob/master/SUPPORT.md) |
[Contributing](https://github.com/electron-userland/electron-forge/blob/master/CONTRIBUTING.md) |
[Changelog](https://github.com/electron-userland/electron-forge/blob/master/CHANGELOG.md)

# Getting Started

**Note**: Electron Forge requires Node 6 or above, plus git installed.

```bash
npm install -g electron-forge
electron-forge init my-new-app
cd my-new-app
npm start
```

Alternatively, if you have a more recent version of `npm` or `yarn`, you can use
[`npx`](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b),
or
[`yarn create`](https://yarnpkg.com/blog/2017/05/12/introducing-yarn/).

```bash
npx electron-forge init my-new-app
# or
yarn create electron-app my-new-app

# then
cd my-new-app
npm start
```

# Project Goals

1. Starting with Electron should be as simple as a single command.
2. Developers shouldn't have to worry about `babel`, `browserify`, `webpack`,
   native module rebuilding, etc.  Everything should "just work" for them out
   of the box.
3. Everything from creating the project to packaging the project for release
   should be handled by one dependency in a standard way while still offering
   users maximum choice and freedom.

With these goals in mind, under the hood this project uses, among others:

* [`electron-compile`](https://github.com/electron/electron-compile): a tool
  that lets you use modern and futuristic languages inside Electron without
  worrying about transpiling or build tooling.
* [`electron-rebuild`](https://github.com/electron/electron-rebuild):
  Automatically recompiles native Node.js modules against the correct
  Electron version.
* [Electron Packager](https://github.com/electron-userland/electron-packager):
  Customizes and bundles your Electron app to get it ready for distribution.

# Usage

## Starting a new Project

```bash
npm install -g electron-forge
electron-forge init my-new-project
```

This command will generate a brand new project folder and install all your Node
module dependencies, so you will be all set to go.  By default we will also
install the `airbnb` linting modules.  If you want to follow the `standard`
linting rules instead, use the `--lintstyle=standard` argument.

You can also start a project with your
[favorite framework](https://electronforge.io/templates) with the `--template`
argument.  E.g. `--template=react`.

If you'd like to have pre-made configuration files for Travis CI and AppVeyor CI to automatically
build and deploy distributables to GitHub, use the `--copy-ci-files` argument.

## Importing an existing Project

```bash
electron-forge import existing-project-directory
```

Given an existing Electron project, this command will attempt to interactively
navigate through the process of importing it to the Electron Forge format, so
the commands listed below can be used. This includes being prompted to remove
existing Electron build tools in favor of Electron Forge equivalents.

## Launching your Project

```bash
electron-forge start
```

Any arguments after "start" will be passed through to your application when
it's launched.

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

This will generate platform specific distributables (installers, distribution
packages, etc.) for you. By default, you can only generate distributables
for your current platform. If you want to specify platform / arch, use the
`--platform=<platform>` and `--arch=<arch>` arguments, but _please note that
some distributables are not available to be built on anything but the platform
that is targeted. For example, `appx` (Windows Store) distributables can only
be built on Windows._

## Linting your Project

```bash
electron-forge lint
```

## Publishing your Project

```bash
electron-forge publish
```

This will `make` your project and publish any generated artifacts.  By default it will publish to
GitHub, but you can change the publish target(s) with `--target=YourTarget,YourTarget2`, where the
value is a comma-separated list of targets.

# Config

Once you have generated a project, your `package.json` file will have some
default `forge` configuration.  Below is the reference structure for this
config object:

```javascript
{
  "make_targets": {
    "win32": ["squirrel"], // An array of win32 make targets
    "darwin": ["zip", "dmg"], // An array of darwin make targets
    "linux": ["deb", "rpm", "flatpak", "snap"] // An array of linux make targets
  },
  "electronPackagerConfig": {},
  "electronRebuildConfig": {},
  "electronWinstallerConfig": {},
  "electronInstallerDMG": {},
  "electronInstallerFlatpak": {},
  "electronInstallerDebian": {},
  "electronInstallerRedhat": {},
  "electronInstallerSnap": {}
}
```

## Possible `make` targets

| Target Name | Available Platforms | Description | Configurable Options | Default? | Requirements |
|-------------|---------------------|-------------|----------------------|----------|--------------|
| `zip`       | All                 | Zips your packaged application | None | Yes | `zip` on Darwin/Linux |
| `squirrel`  | Windows             | Generates an installer and `.nupkg` files for Squirrel.Windows | [`electronWinstallerConfig`](https://github.com/electron/windows-installer#usage) | Yes |  |
| `appx`      | Windows             | Generates a Windows Store package | [`windowsStoreConfig`](https://github.com/felixrieseberg/electron-windows-store#programmatic-usage) | No |  |
| `wix`       | Windows             | Generates a traditional MSI file | [`electronWixMSIConfig`](https://github.com/felixrieseberg/electron-wix-msi#configuration) | No | [Wix Toolit](https://github.com/felixrieseberg/electron-wix-msi#prerequisites) |
| `dmg`       | Darwin              | Generates a DMG file | [`electronInstallerDMG`](https://github.com/mongodb-js/electron-installer-dmg#api) | No |  |
| `deb`       | Linux               | Generates a Debian package | [`electronInstallerDebian`](https://github.com/unindented/electron-installer-debian#options) | Yes | [`fakeroot` and `dpkg`](https://github.com/unindented/electron-installer-debian#requirements) |
| `rpm`       | Linux               | Generates an RPM package | [`electronInstallerRedhat`](https://github.com/unindented/electron-installer-redhat#options) | Yes | [`rpm`](https://github.com/unindented/electron-installer-redhatn#requirements) |
| `flatpak`   | Linux               | Generates a [Flatpak](http://flatpak.org/) file | [`electronInstallerFlatpak`](https://github.com/endlessm/electron-installer-flatpak#options) | No | [`flatpak-builder`](https://github.com/endlessm/electron-installer-flatpak#requirements) |
| `snap`      | Linux               | Generates a [Snap](https://snapcraft.io/) file | [`electronInstallerSnap`](https://github.com/electron-userland/electron-installer-snap/blob/master/docs/api.md#options) | No | [`snapcraft`](https://snapcraft.io/docs/build-snaps/#install-snapcraft) |

## Configuring `package`

You can set `electronPackagerConfig` with any of the options from
[Electron Packager](https://github.com/electron-userland/electron-packager/blob/master/docs/api.md), except:

* `all`
* `arch` (use the `--arch` Forge command line argument instead, so it's available to all of Forge)
* `asar.unpack` (use `asar.unpackDir` instead)
* `dir` (use the `cwd` Forge command line argument instead, so it's available to all of Forge)
* `electronVersion` (uses the exact version specified for `electron-prebuilt-compile` in your `devDependencies`)
* `out`
* `platform` (use the `--platform` Forge command line argument instead, so it's available to all of Forge)
* `quiet`

You can set `electronRebuildConfig` with any of the options from
[Electron Rebuild](https://github.com/electron/electron-rebuild#how-can-i-integrate-this-into-grunt--gulp--whatever), except:

* `electronVersion`/`--version` (uses the exact version specified for `electron-prebuilt-compile` in your `devDependencies`)
* `arch`/`--arch` (use the `--arch` Forge command line argument instead, so it's available to all of Forge)
* `buildPath`/`--module-dir` (uses your project's `node_modules`)

**NOTE:** You can also set your `forge` config property of your package.json to point to a JS file that exports the config object:

```js
{
  ...
  "config": {
    "forge": "./forge.config.js"
  }
  ...
}
```

**NOTE:** If you use the JSON object then the `afterCopy` and `afterExtract` options are mapped to `require`
calls internally, so provide a path to a file that exports your hooks and they will still run.  If you use
the JS file method mentioned above then you can use functions normally.

## Possible `publish` targets

| Target Name | Description | Required Config |
|-------------|-------------|-----------------|
| GitHub Releases - `github` | Makes a new release for the current version (if required) and uploads the make artifacts as release assets | `process.env.GITHUB_TOKEN` - A personal access token with access to your releases <br />`forge.github_repository.owner` - The owner of the GitHub repository<br />`forge.github_repository.name` - The name of the GitHub repository <br />`forge.github_repository.draft` - Create the release as a draft, defaults to `true` <br />`forge.github_repository.prerelease` - Identify the release as a prerelease, defaults to `false` <br />`forge.github_repository.options` - An `Object` of [connection options](https://github.com/octokit/rest.js#usage), e.g., GitHub Enterprise settings or HTTP proxy URL |
| Amazon S3 - `s3` | Uploads your artifacts to the given S3 bucket | `process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY` - Your secret access token for your AWS account _(falls back to the standard `AWS_SECRET_ACCESS_KEY` environment variable)_<br />`forge.s3.accessKeyId` - Your access key for your AWS account _(falls back to the standard `AWS_ACCESS_KEY_ID` environment variable)_<br />`forge.s3.bucket` - The name of the S3 bucket to upload to<br />`forge.s3.folder` - The folder path to upload to inside your bucket, defaults to your application version<br />`forge.s3.public` - Whether to make the S3 upload public, defaults to `false` |
| [Electron Release Server](https://github.com/ArekSredzki/electron-release-server) - `electron-release-server` |  Makes a new release for the current version and uploads the artifacts to the correct platform/arch in the given version.  If the version already exists no upload will be performed. | `forge.electronReleaseServer.baseUrl` - The base URL of your release server, no trailing slash<br />`forge.electronReleaseServer.username` - The username for the admin panel on your server<br />`forge.electronReleaseServer.password` - The password for the admin panel on your server<br />`forge.electronReleaseServer.channel` - If specified, the release channel name. Defaults to `stable`/`alpha`/`beta` depending on the app version |
| [Snapcraft](https://snapcraft.io/store/) - `snapStore` | Uploads generated Snaps to the Snap Store. | `forge.snapStore.release` - If specified, a comma-separated list of channels to release to. |

For example:

```javascript
// github
{
  // Assume the GitHub repository is at https://github.com/username/repo
  "github_repository": {
    "owner": "username",
    "name": "repo"
  }
}

// s3
{
  "s3": {
    "accessKeyId": "<AWS_ACCESS_KEY>",
    "bucket": "my_bucket_name",
    "public": true
  }
}

// Electron Release Server
{
  "electronReleaseServer": {
    "baseUrl": "https://update.mysite.com",
    "username": "admin",
    "password": "no_one_will_guess_this"
  }
}

// Snap Store
{
  "snapStore": {
    "release": "candidate,beta"
  }
}
```

## Custom `make` and `publish` targets

You can make your own custom targets for the `make` and `publish` targets.  If you publish them as
`electron-forge-publisher-{name}` or `electron-forge-maker-{name}`, they can be added to the app's
`devDependencies` and can be specified as `{name}` in the make / publish targets. Publicly published
third-party [makers](https://www.npmjs.com/search?q=electron%2Dforge%2Dmaker) and
[publishers](https://www.npmjs.com/search?q=electron-forge-publisher) are available in the NPM registry.

The API for each target type is documented below.

### API for `make` targets

You must export a Function that returns a Promise.  Your function will be called with the following parameters.

* `appDir` - The directory containing the packaged application
* `appName` - The productName of the application
* `targetArch` - The target architecture of the make command
* `forgeConfig` - An object representing the users forgeConfig
* `packageJSON` - An object representing the users package.json file

Your promise must resolve with an array of the artifacts you generated.

### API for `publish` targets

You must export a `Function` that returns a `Promise`.  Your function will be called with the following keyword parameters:

* `dir` - The application directory
* `artifacts` - An array of absolute paths to artifacts to publish
* `packageJSON` - An object representing the user's `package.json` file
* `forgeConfig` - An object representing the user's [`forgeConfig`](#config)
* `authToken` - The value of `--auth-token`
* `tag` - The value of `--tag`
* `platform` - The platform you are publishing for
* `arch` - The arch you are publishing for

You should use `ora` to indicate your publish progress.

## Debugging your application on the command line

If you're using Electron 1.7 or later, you can specify the `--inspect-electron` flag, which will
set the [Electron `--inspect` flag](http://electronjs.org/docs/tutorial/debugging-main-process#--inspectport)
with the default debugger port.

For example:

```shell
electron-forge start --inspect-electron
```

## Debugging your application through VS Code

Debugging your Electron main process through VS Code is ridiculously
easy with Forge.  Simply add this as a launch config in VSCode and you're
good to go.

```js
{
  "type": "node",
  "request": "launch",
  "name": "Electron Main",
  "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron-forge-vscode-nix",
  "windows": {
    "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron-forge-vscode-win.cmd"
  },
  // runtimeArgs will be passed directly to your Electron application
  "runtimeArgs": [
    "foo",
    "bar"
  ],
  "cwd": "${workspaceRoot}"
}
```
