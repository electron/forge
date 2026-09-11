---
description: How to use the command line interface (CLI) commands for Electron Forge
---

# CLI

## Overview

Forge's CLI is the main way to run Electron Forge commands. It consists of a thin wrapper for its core API. Configuration for these commands is done through your [Forge configuration](config/configuration.mdx) object.

If you want to use the core API programmatically, see the [Programmatic usage](cli.md#programmatic-usage) section below.

:::info
Forge's CLI uses comma-separated value strings to pass multiple arguments into a single flag. Depending on your terminal, these comma-separated values may need to be enclosed in quotation marks.
:::

## Installation

To use the Forge CLI, install the `@electron-forge/cli` module into your project as a devDependency. If you're using the `create-electron-app` script, this module will already be installed for you.

```bash
npm install --save-dev @electron-forge/cli
```

## Bootstrap commands

These commands help you get started with Forge. If you're just getting started with Electron Forge, we recommend you follow the [Getting Started](index.md) or [Importing an Existing Project](import-existing-project.md) guides.

:::info
By default, Electron Forge will use `yarn` if it's available on your system when bootstrapping your application.\
\
To run Forge commands with a specific package manager, use the `NODE_INSTALLER` environment variable.

```sh {1}
NODE_INSTALLER=npm npx create-electron-app my-app-dir
```

:::

### Init

:::info
We recommend using the `create-electron-app` script (which uses this command) to get started rather than running Init directly.
:::

This command will initialize a new Forge-powered application in the given directory (defaults to `.`, the current directory).

Please note if you want to use a non-builtin template, it must be installed globally before running the `init` command.

#### Options

All flags are optional.

| Flag              | Value         | Description                                                |
| ----------------- | ------------- | ---------------------------------------------------------- |
| `--template`      | Template Name | Name of the template to use to make this new app           |
| `--copy-ci-files` | N/A           | Set if you want to copy templated CI files _(coming soon)_ |

#### Usage

```bash
npx electron-forge init --template=webpack
```

### Import

This command will attempt to take an existing Electron app and make it compatible with Forge. Normally, this just creates a base Electron Forge configuration and adds the required dependencies.

#### Options

There are no options for the Import command.

#### Usage

```bash
npx electron-forge import
```

## Build commands

The Package, Make, and Publish commands are the three main steps of the Electron Forge build pipeline. Each step relies on the output of the previous one, so they are cascading by default (e.g. running `publish` will first run `package` then `make`.

:::info
For more conceptual details, see the [Build Lifecycle](core-concepts/build-lifecycle.md) guide.
:::

### Package

This command will package your application into a platform-specific executable bundle and put the result in a folder. Please note that this does not make a distributable format. To make proper distributables, please use the Make command.

#### Options

All flags are optional.

| Flag         | Value                    | Description                                                    |
| ------------ | ------------------------ | -------------------------------------------------------------- |
| `--arch`     | Architecture, e.g. `x64` | Target architecture to package for. Defaults to the host arch. |
| `--platform` | Platform, e.g. `mas`     | Target platform to package for. Defaults to the host platform. |

#### Usage

```bash
# By default, the package command corresponds to a package npm script:
npm run package -- --arch="ia32"
# If there is no package script:
npx electron-forge package --arch="ia32"
```

:::warning

#### **Packaging requires `node_modules` to be on disk**

When packaging your Electron app, Forge crawls your project's `node_modules` folder to collect dependencies to bundle. Its module resolution algorithm is naive and doesn't take into account symlinked dependencies nor Yarn's Plug'n'Play (PnP) format.

* If you are using Yarn >=2, please use the `nodeLinker: node-modules` install mode.
* If you are using pnpm, please set `node-linker=hoisted` in your project's `.npmrc` configuration.

:::

### Make

This command will make distributables for your application based on your Forge config and the parameters you pass in.

If you do not need to repackage your application between Make runs, use the `--skip-package` flag.

#### Options

All flags are optional.

| Flag             | Value                               | Description                                                                                                                                                                                                                  |
| ---------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--arch`         | Architecture, e.g. `x64`            | Target architecture to make for. Defaults to the arch that you're running on (the "host" arch). Allowed values are: "ia32", "x64", "armv7l", "arm64", "universal", or "mips64el". Multiple values should be comma-separated. |
| `--platform`     | Platform, e.g. `mas`                | Target platform to make for, please note you normally can only target platform X from platform X. This defaults to the platform you're running on (the "host" platform).                                                     |
| `--targets`      | Comma separated list of maker names | Override your make targets for this run. The maker name is the full node module name, e.g. `@electron-forge/maker-deb`. By default, the make targets used are the ones available and configured for the given platform.      |
| `--skip-package` | N/A                                 | Set if you want to skip the packaging step, useful if you are running sequential makes and want to save time. By default, packaging is **not** skipped.                                                                      |

#### Usage

Basic usage:

```bash
# By default, the make command corresponds to a make npm script:
npm run make -- --arch="ia32"
# If there is no make script:
npx electron-forge make --arch="ia32"
```

Building for ia32 and x64 architectures:

```bash
npm run make -- --arch="ia32,x64"
```

### Publish

This command will attempt to package, make, and publish the Forge application to the publish targets defined in your Forge config.

If you want to verify artifacts from the Make step before publishing, you can use the Dry Run options explained below.

#### Options

All flags are optional.

| Flag             | Value                                   | Description                                                              |
| ---------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `--target`       | Comma separated list of publisher names | Override your publish targets for this run                               |
| `--dry-run`      | N/A                                     | Triggers a publish dry run which saves state and doesn't upload anything |
| `--from-dry-run` | N/A                                     | Attempts to publish artifacts from any dry runs saved on disk            |

#### Usage

```bash {1}
# By default, the publish command corresponds to a publish npm script:
npm run publish -- --from-dry-run
# If there is no publish script:
npx electron-forge publish -- --from-dry-run
```

## Dev commands

### Start

This command will launch your app in dev mode with the `electron` binary in the given directory (defaults to `.`).

If you type `rs` (and hit enter) in the same terminal where you ran the start command, the running app will be terminated and restarted.

Forge plugins can override this command to run custom development logic. For example, the [Webpack Plugin](config/plugins/webpack.mdx) runs a webpack-dev-server instance to provide live reloading and HMR.

#### Options

All flags are optional.

| Flag                 | Value                                       | Description                                                                                         |
| -------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `--app-path`         | Path to your app from the working directory | Override the path to the Electron app to launch (defaults to `.`)                                   |
| `--enable-logging`   | N/A                                         | Enable advanced logging. This will log internal Electron things                                     |
| `--run-as-node`      | N/A                                         | Run the Electron app as a Node.JS script                                                            |
| `--inspect-electron` | N/A                                         | Triggers inspect mode on Electron to allow debugging the main process                               |
| `--`                 | extra arguments                             | Any additional arguments to pass to Electron or the app itself. For example: `-- --my-app-argument` |

#### Usage

```bash
# By default, the start command corresponds to a start npm script:
npm start --enable-logging
# if there is no start script
npx electron-forge start --enable-logging
```

## Programmatic usage

The Forge CLI should suit most use cases, but we do expose the `@electron-forge/core` package for programmatic command usage.

```javascript
const { api } = require('@electron-forge/core');

const main = async () => {
  await api.package({
    // add package command options here
  });
};

main();
```

For more information, see the [API documentation](https://js.electronforge.io/classes/_electron_forge_core.ForgeAPI.html).
