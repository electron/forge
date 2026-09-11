# Electron Release Server

The Electron Release Server target publishes all your artifacts to a hosted instance of [Electron Release Server](https://github.com/ArekSredzki/electron-release-server).

Please note that Electron Release Server is a community powered project and is not associated with Electron Forge or the Electron project directly.

## Installation

```bash
npm install --save-dev @electron-forge/publisher-electron-release-server
```

## Usage

To use `@electron-forge/publisher-electron-release-server`, add it to the `publishers` array in your [Forge configuration](../configuration.mdx):

```javascript title="forge.config.js"
module.exports = {
  // ...
  publishers: [
    {
      name: '@electron-forge/publisher-electron-release-server',
      config: {
        baseUrl: 'https://update.server.com',
        username: 'admin',
        password: process.env.PASSWORD // string
      }
    }
  ]
};
```

Configuration options are documented in [`PublisherERSConfig`](https://js.electronforge.io/interfaces/\_electron\_forge\_publisher\_electron\_release\_server.PublisherERSConfig.html).
