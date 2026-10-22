## maker-zip

`@electron-forge/maker-zip` builds basic `.zip` files containing your packaged application. There are no platform specific dependencies for using this maker and it will run on any platform.

Configuration options are documented in [`MakerZIPConfig`](https://js.electronforge.io/interfaces/_electron-forge_maker-zip.MakerZIPConfig.html).

```javascript
// forge.config.js

module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-zip'
    }
  ]
};
```

### macOS auto-update manifest

When `macUpdateManifestBaseUrl` is set, making for `darwin` also writes a `RELEASES.json` for [Squirrel.Mac's static JSON mode](https://www.electronjs.org/docs/latest/api/auto-updater), including the `sha256` and `size` of the ZIP.

Set `macUpdateDelta` to also create a binary delta from the previous release, which lets up-to-date users download a small patch instead of the whole app. This only runs on a macOS host and needs an Electron version whose Squirrel.Mac supports delta updates; older versions ignore it and download the ZIP.

```javascript
// forge.config.js

module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-zip',
      config: {
        macUpdateManifestBaseUrl: 'https://update.example.com/my-app/darwin/arm64',
        macUpdateDelta: true
      }
    }
  ]
};
```

Deltas only apply to an app that is byte-for-byte identical to the one they were made from, including file permissions. Squirrel.Mac removes group and other write permissions when it installs an update, so remove them before your app is signed, or deltas will stop applying after the first update. The maker refuses to create a delta if it finds such files. See [`MakerZIPConfig.macUpdateDelta`](https://js.electronforge.io/interfaces/_electron-forge_maker-zip.MakerZIPConfig.html#macupdatedelta) for how, and for the other limitations.
