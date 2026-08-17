---
description: Set up automatic updates for your Electron application
---

# Auto Update

Setting up Auto Updates in your app with Electron Forge is mostly the same process [as described in the Electron docs](https://electronjs.org/docs/tutorial/updates). Forge enhances your workflow by publishing your app to the right place for you. There are three main ways you can do auto updates.

:::warning
Note that having a [signed](../guides/code-signing/code-signing-macos.md) application is a pre-requisite for using auto updates on macOS.
:::

## Open source apps: update.electronjs.org

Open source apps hosted on GitHub can use a free auto update service from the Electron team, [update.electronjs.org](auto-update.md#open-source-apps-updateelectronjsorg). To use this module with Forge, set up the [GitHub Publisher](../config/publishers/github.md) and add the [`update-electron-app`](https://github.com/electron/update-electron-app) module to your app.

This setup is going to be around 2 lines of code and a few lines of configuration. It is by far the easiest way to set up auto updates if you're an open source app.

## Hosting updates on static storage providers

If you are using any of Forge's built-in Publishers that upload your artifacts to static storage, they each have a documentation section on how to configure your app to auto update using those uploaded artifacts. Check out each of the options:

* [Amazon S3](../config/publishers/s3.mdx#auto-updating-from-s3)
* Google Cloud Storage _(Coming Soon)_

## Hosting your own update server

If you're not open source or you want slightly more control over your update service (like percentage based rollouts, or more release channels) you can host your own update server such as [`nucleus`](https://github.com/atlassian/nucleus) or [`nuts`](https://github.com/GitbookIO/nuts). See the full list of known Electron update servers in the [Electron's Updating Applications docs](https://electronjs.org/docs/tutorial/updates#deploying-an-update-server).

Each update server will have their own configuration for your actual app, but publishing should be done from Forge for most of them:

* `nucleus` - Use the [Nucleus](../config/publishers/nucleus.md) publish target
* `nuts` - Use the [GitHub](../config/publishers/github.md) publish target
* `electron-release-server` - Use the [Electron Release Server](../config/publishers/electron-release-server.md) publish target
* `hazel` - Use the [GitHub](../config/publishers/github.md) publish target
