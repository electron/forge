
## maker-wix-msi

The WiX MSI target builds `.msi` files, which are "traditional" Windows installer files.

Pre-requisites:
* `light` and `candle` installed from [the WiX toolkit](https://github.com/felixrieseberg/electron-wix-msi#prerequisites).

Configuration options are documented in [`MakerWixConfig`](https://js.electronforge.io/interfaces/_electron_forge_maker_wix.MakerWixConfig.html).

```javascript
{
  name: '@electron-forge/maker-wix',
  config: {
    language: 1033,
    manufacturer: 'My Awesome Company'
  }
}
```
