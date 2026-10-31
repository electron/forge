## maker-dmg

`@electron-forge/maker-dmg` builds `.dmg` files, which are the standard format for sharing macOS apps. You can only build the DMG target on macOS machines.

Configuration options are documented in [`MakerDMGConfig`](https://packages.electronjs.org/forge/latest/interfaces/_electron-forge_maker-dmg.MakerDMGConfig.html).

```javascript
// forge.config.js

module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {
        background: './assets/dmg-background.png',
        format: 'ULFO'
      }
    }
  ]
};
```
