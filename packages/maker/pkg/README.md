## Electron Forge: Maker PKG

`@electron-forge/maker-pkg` builds `.pkg` files for macOS. These are used to upload your application to the Mac App Store or just as an alternate distribution method for macOS users.  You can only build the Pkg target on macOS machines while targeting the `darwin`  or `mas` platforms.

Configuration options are documented in [`MakerPkgConfig`](https://js.electronforge.io/interfaces/_electron_forge_maker_pkg.MakerPKGConfig.html).

```javascript
{
  name: '@electron-forge/maker-pkg',
  config: {
    keychain: 'my-secret-ci-keychain'
  }
}
```
