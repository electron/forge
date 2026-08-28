---
description: How to create an Electron app with the Parcel bundler and Electron Forge
hidden: true
---

# Parcel

Unfortunately, Parcel 1 does not have the necessary integration points or native module support to be able to have its own plugin. However, if you wish to do the integration yourself, [Electron Fiddle](https://electronjs.org/fiddle) can be used [as a model for how to use Electron Forge in conjunction with Parcel 1](https://github.com/electron/fiddle/blob/v0.19.0/tools/parcel-build.js).

We hope to work with the Parcel developers in the future as they work on [Electron support in Parcel 2](https://github.com/parcel-bundler/parcel/issues/2492).
