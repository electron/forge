---
description: Modules to extend Forge's core functionality
---

# Plugins

Electron Forge has a plugin system which allows you to extend its core functionality.

By default, Forge takes a vanilla JS application and packages, makes and publishes it (see the [Build Lifecycle](../../core-concepts/build-lifecycle.md) document for more details). Plugins can execute custom logic during any of the Forge [Hooks](../hooks.md) during the build process, and can also override the [Start](../../cli.md#start) command in development.

:::info
If you want to write your own Forge plugin, check out the [Writing Plugins](../../advanced/extending-electron-forge/writing-plugins.md) guide.
:::

## Bundler plugins

- [Webpack Plugin](webpack.mdx) - Build your Electron app with webpack
- [Vite Plugin](vite.mdx) - Build your Electron app with Vite

## Utility plugins

- [Auto Unpack Native Modules Plugin](auto-unpack-natives.md) - Unpack native Node.js modules from your Forge app's ASAR archive.
- [Local Electron Plugin](local-electron.md) - Integrate a local build of Electron into your Forge app.
- [Fuses Plugin](fuses.mdx) - Toggle Electron functionality at package-time with Electron Fuses.
- [Electronegativity Plugin](electronegativity.md) - Check for misconfigurations and security anti-patterns with the Electronegativity tool.
