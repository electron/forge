## maker-msix

> [!IMPORTANT]
> This module is _experimental_ and is subject to breaking changes between releases.
> See GitHub Releases change notes for migration instructions.

`@electron-forge/maker-msix` builds `.msix` packages, which can be distributed directly or via the Windows Store.

You can only build the MSIX target on Windows machines with the Windows 10 SDK installed.

Configuration options are documented in [`MakerMSIXConfig`](https://js.electronforge.io/interfaces/_electron_forge_maker_msix.MakerMSIXConfig.html).

maker-msix utilizes @electron/windows-sign via the `windowsSignOptions` property. See the [windows-sign documentation](https://github.com/electron/windows-sign/blob/main/README.md) for details.

```javascript
{
  name: '@electron-forge/maker-msix',
  config: {
    manifestVariables: {
      publisher: 'Electron Dev'
    },
    windowsSignOptions: {
      certificatePassword: '12345'
    }
  }
}
```
