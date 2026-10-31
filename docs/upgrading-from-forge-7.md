---
description: Breaking changes and migration steps for moving an app from Electron Forge 7 to Forge 8.
---

# Upgrading from Forge 7

Forge 8 is a major release. Most apps need a newer Node.js, a few `package.json` and config edits, and updated CI paths. This page lists every breaking change, grouped by area, with what you need to do.

## Quick checklist

1. Use Node.js 22.17 or newer, locally and in CI.
2. Update all `@electron-forge/*` packages to the same 8.x version.
3. If you use the Vite or webpack plugin, point `main` in `package.json` at the new `.cjs` bundle (see [Bundler plugins](#bundler-plugins)).
4. Replace any config templating (`${version}`, `require:./file`) with plain JavaScript.
5. Remove `@electron-forge/plugin-electronegativity` if you use it.
6. Update CI globs for DMG and PKG output, which now go into per-arch folders.
7. Replace `electron-forge publish` with `electron-forge release` in scripts (the old name still works, with a warning).

## Runtime and module format

### Node.js 22.17+ is required

Every Forge package now requires Node.js 22.13 or newer. We recommend 22.17 or newer, since packaging uses `fs/promises` `glob`, which prints an `ExperimentalWarning` on earlier 22.x releases.

### Forge packages are ESM-only

All `@electron-forge/*` packages are now ES modules. If you only use the CLI, nothing changes: `forge.config.js` in a CommonJS project, `.cjs`, `.mjs`, `.ts`, `.mts` and `.cts` configs all still load.

If you call the programmatic API with `require('@electron-forge/core')`, it relies on Node's `require(esm)` support, which is on by default in Node 22.12+. Switching to `import` is the safest path.

### Custom makers, publishers, plugins and hooks need a default export

Forge now loads these with `import()` and only uses the default export. Forge 7 fell back to the whole module when there was no default export.

Make sure each custom module has `export default` (ESM) or `module.exports = …` (CommonJS).

### Config templating has been removed

Forge 7 ran every string in your config through a template engine, so values like `${version}` or `${year}` were filled in from `package.json`, and `require:./file` strings were replaced by that module. Forge 8 does neither.

```js title="forge.config.js (before)"
module.exports = {
  makers: [{ name: '@electron-forge/maker-zip', config: { macUpdateManifestBaseUrl: 'https://example.com/${version}' } }],
};
```

```js title="forge.config.js (after)"
const { version } = require('./package.json');

module.exports = {
  makers: [{ name: '@electron-forge/maker-zip', config: { macUpdateManifestBaseUrl: `https://example.com/${version}` } }],
};
```

### Only JavaScript and TypeScript config files are loaded

Forge no longer uses `rechoir`/`interpret`. Only `forge.config.{js,mjs,cjs,ts,mts,cts}` are discovered. Convert configs in other languages (for example `.coffee` or Babel-registered `.babel.js`) to JavaScript or TypeScript.

### Listr 11

Plugin authors who return Listr tasks from hooks: `listr2` is now v11, and `Listr.errors` is `null` unless `collectErrors` is set.

## CLI and API

### `init` and `import` moved to `create-electron-app`

`electron-forge init` and `electron-forge import` have been removed from the CLI and from `@electron-forge/core`.

```bash
# Create a new app
npx create-electron-app@latest my-app

# Add Forge to an existing app
npx create-electron-app@latest import my-existing-app
```

If you call them programmatically, import `init` and `import` from `create-electron-app` instead.

Related changes:

* `import` no longer migrates Forge 5 projects. Upgrade those by hand, or with an older Forge first.
* Templates installed globally with npm or Yarn are no longer searched. Pass an absolute path to a custom template instead.
* `create-electron-app` no longer guesses your package manager from the command that launched it. It asks interactively, and defaults to npm otherwise. In scripts and CI, pass `--package-manager` (for example `--package-manager pnpm` or `--package-manager yarn@1.22.22`).
* The `webpack-typescript` and `vite-typescript` templates are gone. Use `--template=webpack --typescript` or `--template=vite --typescript`. See [Vite](templates/vite.md) and [Webpack](templates/webpack-template.md).

### `publish` is now `release`

The `publish` command, `api.publish()` and `PublishOptions` are now `release`, `api.release()` and `ReleaseOptions`. The old names still work but are deprecated.

### Renamed `make` and `release` flags

| Forge 7 | Forge 8 |
| --- | --- |
| `make --skip-package` | `make --from-package` |
| `publish --dry-run` | Run `make`; it now always saves its results to `out/make-results/` |
| `publish --from-dry-run` | `release --from-make` |

The old flags still work with a deprecation warning. Dry-run state saved by Forge 7 (`out/publish-dry-run/`) is not read by Forge 8, so run `make` again with Forge 8 before `release --from-make`. See the [CLI](cli.md) docs.

### Config is resolved once per command

`make` and `release` no longer re-resolve the config for their nested `package` and `make` steps. Plugin `init()` and the `resolveForgeConfig` hook now run once per command instead of two or three times. Check plugins that relied on running more than once or on getting a fresh config object per step.

### Stricter arch and platform types

`ForgeArch` is now `OfficialArch | 'all'` and `ForgePlatform` is `OfficialPlatform` from `@electron/packager`. TypeScript code that passes other strings will get type errors.

## Bundler plugins

### Main and preload bundles are emitted as `.cjs`

Update `main` in `package.json`:

| Plugin | Forge 7 | Forge 8 |
| --- | --- | --- |
| Vite | `.vite/build/main.js` | `.vite/build/main.cjs` |
| webpack | `.webpack/main` | `.webpack/main/index.cjs` |

With Vite, also change preload paths to `path.join(__dirname, 'preload.cjs')`. Both plugins fail early with a message naming the fix if `main` is wrong.

### Vite 8

The Vite plugin now targets Vite 8 (Rolldown). Upgrade your project's `vite` dependency to 8.x and port any custom Rollup options. Production and dev builds now run each target in its own worker process.

### webpack: `loggerPort` removed

The browser-based logger on port 9000 has been replaced by a terminal UI. Remove `loggerPort` from your webpack plugin config. While the UI is shown, press `r` to restart the app.

`webpack-dev-server` is now v5, so custom `devServer` options must follow its v5 API.

## Makers

* **DMG and PKG output moved.** `out/make/<name>.dmg` is now `out/make/dmg/<arch>/<name>.dmg`, and `out/make/<name>.pkg` is now `out/make/pkg/<arch>/<name>.pkg`. Update CI upload globs and scripts.
* **AppX is deprecated.** [`@electron-forge/maker-appx`](config/makers/appx.md) is now a wrapper over [`@electron-forge/maker-msix`](config/makers/msix.md) and produces `.msix` files. Several options are ignored with a warning, no dev certificate is generated when `devCert` is unset, and a missing publisher is now an error. Move to the MSIX maker.
* **deb rejects unknown arches.** Supported arches are `ia32`, `x64`, `arm64`, `armv7l` and `mips64el`; `arm` (armel) is no longer mapped. `fakeroot` is no longer required.
* **deb and rpm** now use `electron-installer-debian` and `electron-installer-redhat` v4. Check their release notes if you pass installer-specific options.
* **WiX MSI** throws on arches other than `x64`, `ia64` and `x86`, and now passes the target arch to `electron-wix-msi`.
* **Type renames.** `MakerFlatpakOptionsConfig` is now `MakerFlatpakConfigOptions`. `@electron-forge/maker-dmg` no longer re-exports `electron-installer-dmg` types such as `CodeSignOptions` and `DMGContents`; import them from `electron-installer-dmg`.

## Publishers

* **`keyResolver` takes one object.** For S3, GCS and other static publishers, `keyResolver(fileName, platform, arch)` is now `keyResolver({ fileName, platform, arch, version })`.
* **GCS access options.** `public`, `private` and `predefinedAcl` are replaced by `uploadOptions`, which is passed to the upload call. `public: true` becomes `uploadOptions: { predefinedAcl: 'publicRead' }`.
* **GCS no longer gzips uploads.** Set `uploadOptions: { gzip: true }` to restore the old behavior.
* **`PublisherGithub` is now `PublisherGitHub`.** This only affects code that imports the class by name.

## Plugins

* **Fuses** needs `@electron/fuses` 2.x: `npm install --save-dev @electron/fuses@^2`.
* **Electronegativity** has been removed. Remove `@electron-forge/plugin-electronegativity` from your config and dependencies.

## Removed packages

* `@electron-forge/template-vite-typescript` and `@electron-forge/template-webpack-typescript` (use `--typescript`)
* `@electron-forge/web-multi-logger` (replaced by `@electron-forge/multi-logger`)
* `@electron-forge/plugin-electronegativity`
