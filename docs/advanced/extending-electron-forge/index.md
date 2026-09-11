# Extending Electron Forge

Electron Forge is designed to be easily extendable by third parties with whatever build logic you need. The build flow for Electron Forge is split into two main sections, `make` and `publish`, and you can define custom targets for each of those commands. For everything else we have a Plugin API which allows you to hook into pretty much any part of Forge's standard build process and do whatever you want.

To briefly explain some terms:

* `maker`: A tool that takes a packaged Electron application and outputs a certain kind of distributable
* `publisher`: A tool that takes distributables and "publishes" \(normally just uploads\) them somewhere \(for example, GitHub releases\)
* `plugin`: A tool that hooks into Forge's internals and can inject logic into your build process
