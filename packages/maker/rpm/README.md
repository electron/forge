## Electron Forge: Maker RPM

`@electron-forge/maker-rpm` builds `.rpm` files, which is the standard package format for RedHat-based Linux distributions such as Fedora.

You can only build the RPM target on Linux machines with the `rpm` or `rpm-build` packages installed.

Configuration options are documented in [`MakerRpmConfigOptions`](https://js.electronforge.io/interfaces/_electron_forge_maker_rpm._internal_.MakerRpmConfigOptions.html).

```javascript
{
  name: '@electron-forge/maker-rpm',
  config: {
    options: {
      name: 'QuickEdit',
      homepage: 'http://example.com'
    }
  }
}
```
