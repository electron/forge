# Electron Forge CLI

{% method %}
## Installation

Electron forge's CLI is separate from the core module, to install it you will
have to use the `@electron-forge/cli` module from NPM.

{% sample lang="sh" %}
```sh
# NPM
npm i -g @electron-forge/cli

# Yarn
yarn global add @electron-forge/cli
```

{% endmethod %}

## Overview

At a high level the CLI module is just a proxy to the raw
[API](https://docs.electronforge.io) commands.  Almost all the configuation
is still done in your [Forge Config](config), the CLI just provides a handy
way to trigger all the core functionality of Electron Forge (and you should
definitely use it).

## Commands

Please note these commands are sorted in alphabetical order, the ones you
probably need to care about are [`start`](#start), [`package`](#package),
[`make`](#make) and [`publish`](#publish).

### Import

Maps to `electronForge.import`, will attempt to take an existing Electron app
and make it Forge compatible.  Normally this is just created a base forge config
and adding the required dependencies.

> There are no flags for the Import command

### Init

Maps to `electronForge.init`, will initialize a new Forge powered application in
the given directory (defaults to `.`).

Please note if you want to use a template it must be installed globally before
running the `init` command.

| Flag | Value | Description |
|------|-------|-------------|
| `--template` | Template Name | Name of the template to use to make this new app|
| `--copy-ci-files` | N/A | Set if you want to copy templated CI files for Travis CI and Appveyor |

### Install

Maps to `electronForge.install`, will attempt to install the Electron app
that is published at the given GitHub repository.  This command is just a helper
for installing other applications quickly.

### Lint

Maps to `electronForge.lint`, will run the `lint` command that your package.json
exposes.  If the exit code is 0 no output is shown, otherwise the error output
will be displayed.

> There are no flags for the Lint command

### Make

Maps to `electronForge.make`, will make distributables for your application
based on your forge config and the parameters you pass in.

| Flag | Value | Description |
|------|-------|-------------|
| `--arch` | Architecture E.g. `x64` | Target architecture to make for |
| `--platform` | Platform E.g. `mas` | Target platform to make for, please note you normally can only target platform X from platform X |
| `--targets` | Comma separated list of maker names | Override your make targets for this run |
| `--skip-package` | N/A | Set if you want to skip the packaging step, useful if you are running sequential makes and want to save time |

### Package

Maps to `electronForge.package`, will package your application into a platform
specific format and put the result in a folder.  Please note that this does not
make a distributable format, to make proper distributables please use the
[`make`](#make) command.

| Flag | Value | Description |
|------|-------|-------------|
| `--arch` | Architecture E.g. `x64` | Target architecture to package for |
| `--platform` | Platform E.g. `mas` | Target platform to package for |

### Publish

Maps to `electronForge.publish`, will attempt to make the forge application
and then publish it to the publish targets defined in your forge config.

If you want to publish previously created `make` artifacts you will have to use
the `dry-run` options explained below.

| Flag | Value | Description |
|------|-------|-------------|
| `--tag` | Version | The version to publish these artifacts as |
| `--target` | Comma separated list of publisher names | Override your publish targets for this run |
| `--dry-run` | N/A | Triggers a publish dry run which saves state and doesn't upload anything |
| `--from-dry-run` | N/A | Attempts to publish artifacts from any dry runs saved on disk |

### Start

Maps to `electronForge.start`, will launch the Forge powered application in the
given directory (defaults to `.`).

| Flag | Value | Description |
|------|-------|-------------|
| `--app-path` | Path to your app from CWD | Override the path to the Electron app to launch (defaults to '.') |
| `--enable-logging` | N/A | Enable advanced logging. This will log internal Electron things |
| `--run-as-node` | N/A | Run the Electron app as a Node.JS script |
| `--inspect-electron` | N/A | Triggers inspect mode on Electron to allow debugging the main process |
