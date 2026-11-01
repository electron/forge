## maker-appx

> **Deprecated:** use [`@electron-forge/maker-msix`](https://www.electronforge.io/config/makers/msix) instead.

`@electron-forge/maker-appx` is a legacy compatibility layer over the MSIX maker. It maps its `MakerAppXConfig` onto `electron-windows-msix` and builds a `.msix` package, which is designed to target the Windows Store.

You can only build the AppX target on Windows machines with the Windows 10 SDK installed.

When `devCert` is not set, `electron-windows-msix` signs the package with a self-signed development certificate, which the maker saves next to the `.msix` as `dev_cert.cer` and `dev_cert.pfx` so it can be trusted on a test device. The `.pfx` password is `WINDOWS_CERTIFICATE_PASSWORD` when that environment variable is set, otherwise a random one.

Configuration options are documented in [`MakerAppXConfig`](https://js.electronforge.io/interfaces/_electron-forge_maker-appx.MakerAppXConfig.html).

```javascript
// forge.config.js

module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-appx',
      config: {
        publisher: 'CN=developmentca',
        devCert: 'C:\\devcert.pfx',
        certPass: 'abcd'
      }
    }
  ]
};
```
