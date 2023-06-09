## maker-deb

`@electron-forge/maker-deb` builds .deb packages, which are the standard package format for Debian-based Linux distributions such as Ubuntu. You can only build the deb target on Linux or macOS machines with the fakeroot and dpkg packages installed.

Configuration options are documented in [`MakerDebConfigOptions`](https://js.electronforge.io/interfaces/_electron_forge_maker_deb.InternalOptions.MakerDebConfigOptions.html).

```javascript
{
  name: '@electron-forge/maker-deb',
  config: {
    options: {
      maintainer: 'The Forgers',
      homepage: 'https://example.com',
      icon: 'path/to/icon.svg'
    }
  }
}
```
