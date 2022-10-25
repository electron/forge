## Electron Forge: Publisher Electron Release Server

`@electron-forge/publisher-electron-release-server` publishes all your artifacts to a hosted instance of [Electron Release Server](https://github.com/ArekSredzki/electron-release-server) where users will be able to download them.

Please note that Electron Release Server is a community powered project and is not associated with Electron Forge or the Electron project directly.

Configuration options are documented in [`PublisherERSConfig`](https://js.electronforge.io/interfaces/_electron_forge_publisher_electron_release_server.PublisherERSConfig.html).


```javascript title=forge.config.js
module.exports = {
  // ...
  publishers: [
    {
      name: '@electron-forge/publisher-electron-release-server',
      config: {
        baseUrl: 'https://update.server.com',
        username: 'admin',
        password: 'admin'
      }
    }
  ]
}
```