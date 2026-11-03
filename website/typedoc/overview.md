---
title: API reference
sidebar_label: Overview
---

# API reference

Types, classes and functions of every `@electron-forge/*` package, generated from the Forge {{FORGE_VERSION}} source.

## Configuration

Your Forge configuration is a [`ForgeConfig`](shared-types/type-aliases/ForgeConfig.md) object.

| Key              | Type                                                                            |
| ---------------- | ------------------------------------------------------------------------------- |
| `packagerConfig` | [`ForgePackagerOptions`](shared-types/interfaces/ForgePackagerOptions.md)       |
| `rebuildConfig`  | [`ForgeRebuildOptions`](shared-types/interfaces/ForgeRebuildOptions.md)         |
| `makers`         | [`ForgeConfigMaker`](shared-types/type-aliases/ForgeConfigMaker.md)`[]`         |
| `publishers`     | [`ForgeConfigPublisher`](shared-types/type-aliases/ForgeConfigPublisher.md)`[]` |
| `plugins`        | [`ForgeConfigPlugin`](shared-types/type-aliases/ForgeConfigPlugin.md)`[]`       |
| `hooks`          | [`ForgeHookMap`](shared-types/type-aliases/ForgeHookMap.md)                     |

Each maker, publisher and plugin takes its own config object, such as [`MakerZIPConfig`](maker-zip/interfaces/MakerZIPConfig.md) or [`VitePluginConfig`](plugin-vite/VitePlugin/interfaces/VitePluginConfig.md). Its package page in the sidebar lists it first.

## Programmatic API

`@electron-forge/core` exports [`api`](core/variables/api.md), an instance of [`ForgeAPI`](core/classes/ForgeAPI.md).

| Method                                        | Options                                                   | Resolves to                                                               |
| --------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`package`](core/classes/ForgeAPI.md#package) | [`PackageOptions`](core/interfaces/PackageOptions.md)     | [`ForgePackageResult`](shared-types/interfaces/ForgePackageResult.md)`[]` |
| [`make`](core/classes/ForgeAPI.md#make)       | [`MakeOptions`](core/interfaces/MakeOptions.md)           | [`ForgeMakeResult`](shared-types/interfaces/ForgeMakeResult.md)`[]`       |
| [`release`](core/classes/ForgeAPI.md#release) | [`ReleaseOptions`](core/interfaces/ReleaseOptions.md)     | `void`                                                                    |
| [`start`](core/classes/ForgeAPI.md#start)     | [`StartOptions`](shared-types/interfaces/StartOptions.md) | [`ElectronProcess`](shared-types/interfaces/ElectronProcess.md)           |

## Extending Forge

| To write a | Extend                                                     | Main method receives                                                                          | Implements                                                      |
| ---------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Maker      | [`MakerBase`](maker-base/classes/MakerBase.md)             | `make`: [`MakerOptions`](maker-base/interfaces/MakerOptions.md)                               | [`IForgeMaker`](shared-types/interfaces/IForgeMaker.md)         |
| Publisher  | [`PublisherBase`](publisher-base/classes/PublisherBase.md) | `publish`: [`PublisherOptions`](publisher-base/interfaces/PublisherOptions.md)                | [`IForgePublisher`](shared-types/interfaces/IForgePublisher.md) |
| Plugin     | [`PluginBase`](plugin-base/classes/PluginBase.md)          |                                                                                               | [`IForgePlugin`](shared-types/interfaces/IForgePlugin.md)       |
| Template   |                                                            | `initializeTemplate`: [`InitTemplateOptions`](shared-types/interfaces/InitTemplateOptions.md) | [`ForgeTemplate`](shared-types/interfaces/ForgeTemplate.md)     |

Hooks receive the arguments in [`ForgeSimpleHookSignatures`](shared-types/interfaces/ForgeSimpleHookSignatures.md) and [`ForgeMutatingHookSignatures`](shared-types/interfaces/ForgeMutatingHookSignatures.md).

## Links

Types from Forge's packages link to their pages here. Types from other projects, such as the `@electron/packager` options, link to those projects' docs and end with an external-link icon.
