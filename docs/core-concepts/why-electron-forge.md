---
description: An overview of Forge and its role in shipping Electron apps.
---

# Why Electron Forge

## Motivation

Application packaging and distribution has always been handled outside of the core Electron framework. In Electron's early days as a part of the [Atom editor](https://atom.io/), it was common for app developers to prepare their application for distribution by manually editing the Electron binary.

Since then, the Electron community has developed a rich ecosystem of tools to handle every task for Electron app distribution, including:

* Application packaging (`electron-packager`)
* Code signing (e.g. `@electron/osx-sign`)
* Creating platform-specific installers (e.g. `electron-winstaller` or `electron-installer-dmg`).
* Native Node.js module rebuilding (`electron-rebuild`)
* Universal macOS builds (`@electron/universal`)

Although these single-purpose packages are mature and production-ready, application developers need to understand what each one does and write their own scripts to glue the packages together into a build pipeline. This process requires research and iteration, and can be confusing for folks who are new to Electron.

## Value proposition

Electron Forge is an all-in-one solution that unifies this fractured ecosystem. With Forge, you can create a build pipeline that brings your app from development to distribution with minimal configuration.

Forge is also built with advanced use cases in mind—you can add any build logic you need with custom plugins, makers or publishers. For more details, see the [Extending Electron Forge](../advanced/extending-electron-forge/index.md) section of the docs.

## Forge vs. Builder

Electron Forge can be considered an alternative to [Electron Builder](https://electron.build/), which fulfills the same use-case for application building and publishing.

The key difference in philosophy between the two projects is that Electron Forge focuses on combining existing first-party tools into a single build pipeline, while Builder rewrites its own in-house logic for most build tasks.

We believe there are two main advantages to using Forge:

1. **Forge receives new features for application building as soon as they are supported in Electron** (e.g. [ASAR integrity](https://electronjs.org/docs/latest/tutorial/asar-integrity) or [universal macOS builds](https://github.com/electron/universal)). These features are built with first-party Electron tooling in mind, so Forge receives them as soon as they are released.
2. **Forge's multi-package architecture makes it easier to understand and extend.** Since Forge is made up of many smaller packages with clear responsibilities, it is easier to follow the flow of the code. Also, its extensible API design means that you can write your own build logic separate from the provided configuration options for advanced use cases.
