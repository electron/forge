---
description: Create a ZIP archive for your Electron app using Electron Forge.
---

# ZIP

The ZIP target builds basic [.zip archives](https://en.wikipedia.org/wiki/ZIP\_\(file\_format\)) containing your packaged application. There are no platform-specific dependencies for using this maker and it will run on any platform.

## Installation

```bash
npm install --save-dev @electron-forge/maker-zip
```

## Usage

To use `@electron-forge/maker-zip`, add it to the `makers` array in your Forge configuration.

```javascript title="forge.config.js"
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-zip'
    }
  ]
};
```

All configuration options are optional, and options are documented in the API docs for [MakerZIPConfig](https://js.electronforge.io/interfaces/\_electron\_forge\_maker\_zip.MakerZIPConfig.html).

### Static file auto-updates (macOS)

On macOS, the ZIP maker can be configured to generate update manifests to use with Electron's [autoUpdater](https://electronjs.org/docs/latest/api/auto-updater) module.

```javascript title="forge.config.js"
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-zip',
      config: (arch) => ({
        macUpdateManifestBaseUrl: `https://my-bucket.s3.amazonaws.com/my-app-updates/darwin/${arch}`
      })
    }
  ]
};
```

`macUpdateManifestBaseUrl` should be a path to an object storage bucket where you are storing your release assets. This bucket needs to be organized in folders by platform, then architecture.

The first time you run `make` with this parameter configured, an architecture-specific `RELEASES.json` manifest will be generated. For example, if you are building v1.2.1 of `my-app` for arm64 (Apple Silicon):

```json title="RELEASES.json"
{
  "currentRelease": "1.2.1",
  "releases": [
    {
      "version": "1.2.1",
      "updateTo": {
        "version": "1.2.1",
        "pub_date": "2013-09-18T12:29:53+01:00",
        "name": "my-app v1.2.1",
        "notes": "",
        "url": "https://my-bucket.s3.amazonaws.com/my-app-updates/darwin/arm64/my-app-darwin-arm64-1.2.1.zip",
        "sha256": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        "size": 104857600
      }
    }
  ]
}
```

The `sha256` and `size` of the ZIP let Squirrel.Mac verify the download before installing it. Electron versions without that check ignore them.

Once this asset is uploaded to the bucket, subsequent runs will read from the existing manifest at `https://my-bucket.s3.amazonaws.com/my-app-updates/darwin/arm64/RELEASES.json` and modify it to update the `currentRelease` property to the next version that is built.

For end-to-end instructions on this process, including how to publish assets to S3 and set up the autoUpdater to read the `RELEASES.json` manifest, see the [Auto updating from S3](../publishers/s3.mdx#auto-updating-from-s3) guide.

### Delta updates (macOS)

With `macUpdateDelta` enabled, the ZIP maker also creates a binary delta from the previous release to the one being built. Users updating from the previous release download this small patch instead of the whole app. This needs an Electron version whose Squirrel.Mac supports delta updates ([electron/electron#52820](https://github.com/electron/electron/pull/52820)); older versions ignore the delta and download the ZIP.

```javascript title="forge.config.js"
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-zip',
      config: (arch) => ({
        macUpdateManifestBaseUrl: `https://my-bucket.s3.amazonaws.com/my-app-updates/darwin/${arch}`,
        macUpdateDelta: true
      })
    }
  ]
};
```

When you make a new release, the maker:

1. Reads the `currentRelease` from the existing `RELEASES.json`, then downloads and verifies that release's ZIP.
2. Reads `CFBundleVersion` from the previous app's `Info.plist`. Squirrel.Mac compares this value with the running app's `CFBundleVersion`, which comes from the [`buildVersion`](https://electron.github.io/packager/main/interfaces/Options.html#buildVersion) packager option (the app version by default).
3. Creates the delta with [Sparkle](https://sparkle-project.org)'s `BinaryDelta` tool, then checks it by applying it to a copy of the previous app and verifying the result's code signature.
4. Writes `my-app-darwin-arm64-1.2.1-to-1.2.2.delta` next to the ZIP and adds it to the new release's `updateTo` entry:

```json title="RELEASES.json"
"delta": {
  "from_version": "1.2.1",
  "url": "https://my-bucket.s3.amazonaws.com/my-app-updates/darwin/arm64/my-app-darwin-arm64-1.2.1-to-1.2.2.delta",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "size": 7340032
}
```

Publishers upload the `.delta` file next to the ZIP. Squirrel.Mac checks the delta's size and SHA-256, applies it to a copy of the running app and verifies its code signature. If any step fails, it falls back to the full ZIP in the same update check.

Delta creation only runs on a macOS host; on other hosts the maker logs a warning and makes the release without a delta. By default, the maker uses the Sparkle 2.9.5 `BinaryDelta` from [`@electron-forge/binary-delta`](https://www.npmjs.com/package/@electron-forge/binary-delta), an optional dependency of the ZIP maker that npm installs on macOS. Set `macUpdateDelta: { binaryDeltaPath: '/path/to/BinaryDelta' }` to use your own copy instead. If the delta can't be created, the maker logs a warning and publishes the release without one. Set `macUpdateDelta: { strict: true }` to fail the build instead.

#### Remove group and other write permissions before signing

A delta only applies to an app that is byte-for-byte identical to the one it was created from, **including file permissions**. When Squirrel.Mac installs an update, it removes group and other write permissions from the app. If any file in your app has those permissions when it is signed, installed copies never match the published build, so deltas stop applying after the first update.

The maker runs after your app is signed, so it can't fix this for you. Instead, it refuses to create a delta and lists the affected files. Remove the permissions in a [`packageAfterCopy`](../hooks.md#packageaftercopy) hook, which runs before signing:

```javascript title="forge.config.js"
const { execFileSync } = require('node:child_process');
const path = require('node:path');

module.exports = {
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform) => {
      if (platform === 'darwin') {
        // buildPath is the bundle's Contents/Resources/app folder
        execFileSync('chmod', ['-R', 'go-w', path.resolve(buildPath, '../../..')]);
      }
    }
  }
};
```

Packager creates some files after this hook, such as `app.asar`, so build with a umask of `022` (the macOS default). Extra resources and icons are copied after this hook with their permissions kept, so make sure their source files aren't group-writable either.

#### Limitations

* A `RELEASES.json` file can only offer one delta, from the release immediately before the current one. Users on older releases download the full ZIP.
* The delta is created from the previous release's ZIP as published, so that ZIP must contain the exact signed (and stapled) app that users installed.
* Files outside `app.asar` with non-ASCII names can fail code signature verification after the delta is applied. Squirrel.Mac then falls back to the full ZIP.
