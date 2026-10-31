## publisher-snapcraft

The Snapcraft target publishes your .snap artifacts to the Snap Store. All configuration of your package is done via the Snapcraft maker.

This target requires that the system has the snapcraft utility installed.

Configuration options are documented in [PublisherSnapConfig](https://packages.electronjs.org/forge/latest/interfaces/_electron-forge_publisher-snapcraft.PublisherSnapcraftConfig.html).

```javascript title=forge.config.js
module.exports = {
  // ...
  publishers: [
    {
      name: '@electron-forge/publisher-snapcraft',
      config: {
        release: 'latest/edge, insider/stable'
      }
    }
  ]
};
```
