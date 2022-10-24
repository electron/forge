## Electron Forge: Maker APPX

`@electron-forge/maker-appx` builds `.appx` packages, which are designed to target the Windows Store.

You can only build the AppX target on Windows machines with the Windows 10 SDK installed.

Configuration options are documented in [MakerAppXConfig](https://js.electronforge.io/interfaces/_electron_forge_maker_appx.MakerAppXConfig.html).

```
{
  name: '@electron-forge/maker-appx',
  config: {
    publisher: 'CN=developmentca',
    devCert: 'C:\\devcert.pfx',
    certPass: 'abcd'
  }
}
```