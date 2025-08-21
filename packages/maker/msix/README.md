## maker-appx

`@electron-forge/maker-msix` builds `.msix` packages, which can be distributed directly or via the Windows Store.

You can only build the MSIX target on Windows machines with the Windows 10 SDK installed.

Configuration options are documented in [`MakerMSIXConfig`](https://js.electronforge.io/interfaces/_electron_forge_maker_msix.MakerMSIXConfig.html).

```javascript
{
  name: '@electron-forge/maker-msix',
  config: {
    manifestVariables: {
      publisher: 'Electron Dev'
    },
    cert_pass: '12345'
  },
}
```
