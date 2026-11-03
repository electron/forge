---
title: API reference
sidebar_label: Overview
---

# API reference

Types and classes for every `@electron-forge/*` package, generated from the Forge {{FORGE_VERSION}} source. Start from what you're trying to do.

## Configure Forge

Your `forge.config.ts` is typed as [`ForgeConfig`](shared-types/type-aliases/ForgeConfig.md).

- [`packagerConfig`](shared-types/interfaces/ForgePackagerOptions.md) passes options to `@electron/packager`, and [`rebuildConfig`](shared-types/interfaces/ForgeRebuildOptions.md) to `@electron/rebuild`.
- Each maker, publisher and plugin takes a config object. The sidebar opens each package on that page, for example [`MakerZIPConfig`](maker-zip/interfaces/MakerZIPConfig.md), [`PublisherGitHubConfig`](publisher-github/interfaces/PublisherGitHubConfig.md) or [`VitePluginConfig`](plugin-vite/VitePlugin/interfaces/VitePluginConfig.md).
- [`hooks`](shared-types/type-aliases/ForgeHookMap.md) run your own code during the build. [Hooks](/config/hooks/) explains when each one runs.

Each config page links back to its guide, and the [configuration guide](/config/configuration/) covers the whole file.

## Call Forge from code

`@electron-forge/core` exports [`api`](core/variables/api.md), an instance of [`ForgeAPI`](core/classes/ForgeAPI.md) with the same commands as the [CLI](/cli/). Each method returns a promise of the result:

| Method                                        | Options                                                   | Returns                                                                   |
| --------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`package`](core/classes/ForgeAPI.md#package) | [`PackageOptions`](core/interfaces/PackageOptions.md)     | [`ForgePackageResult`](shared-types/interfaces/ForgePackageResult.md)`[]` |
| [`make`](core/classes/ForgeAPI.md#make)       | [`MakeOptions`](core/interfaces/MakeOptions.md)           | [`ForgeMakeResult`](shared-types/interfaces/ForgeMakeResult.md)`[]`       |
| [`release`](core/classes/ForgeAPI.md#release) | [`ReleaseOptions`](core/interfaces/ReleaseOptions.md)     | `void`                                                                    |
| [`start`](core/classes/ForgeAPI.md#start)     | [`StartOptions`](shared-types/interfaces/StartOptions.md) | [`ElectronProcess`](shared-types/interfaces/ElectronProcess.md)           |

## Extend Forge

Write your own maker, publisher or plugin by extending its base class:

- [`MakerBase`](maker-base/classes/MakerBase.md), see [Writing makers](/advanced/extending-electron-forge/writing-makers/)
- [`PublisherBase`](publisher-base/classes/PublisherBase.md), see [Writing publishers](/advanced/extending-electron-forge/writing-publishers/)
- [`PluginBase`](plugin-base/classes/PluginBase.md), see [Writing plugins](/advanced/extending-electron-forge/writing-plugins/)
- [`ForgeTemplate`](shared-types/interfaces/ForgeTemplate.md), see [Writing templates](/advanced/extending-electron-forge/writing-templates/)

Plugins can also tap into [`ForgeSimpleHookSignatures`](shared-types/interfaces/ForgeSimpleHookSignatures.md) and [`ForgeMutatingHookSignatures`](shared-types/interfaces/ForgeMutatingHookSignatures.md).

## Links in these pages

Types from Forge's own packages link to other pages here. Types that come from other projects, such as `@electron/packager` options, link to those projects' docs and are marked with an external-link icon.
