# Nucleus

The Nucleus target publishes all your artifacts to an instance of Nucleus Update Server, this update service supports all three platforms. Check out the README at [`atlassian/nucleus`](https://github.com/atlassian/nucleus) for more information on this project.

## Installation

```bash
npm install --save-dev @electron-forge/publisher-nucleus
```

## Usage

To use `@electron-forge/publisher-nucleus`, add it to the `publishers` array in your [Forge configuration](../configuration.mdx):

```javascript title="forge.config.js"
module.exports = {
  // ...
  publishers: [
    {
      name: '@electron-forge/publisher-nucleus',
      config: {
        host: 'https://my-nucleus.mysite.com',
        appId: 1,
        channelId: 'abcdefg',
        token: process.env.TOKEN // string
      }
    }
  ]
};
```

Configuration options are documented in [`PublisherNucleusConfig`](https://js.electronforge.io/interfaces/\_electron\_forge\_publisher\_nucleus.PublisherNucleusConfig.html).
