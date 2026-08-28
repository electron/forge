# Bitbucket

The Bitbucket publish target allows you to publish your artifacts directly to Bitbucket where users will be able to download them.

:::warning
This publish target is for [Bitbucket Cloud](https://bitbucket.org) only and will not work with self hosted Bitbucket Server instances.
:::

## Installation

```bash
npm install --save-dev @electron-forge/publisher-bitbucket
```

## Usage

To use `@electron-forge/publisher-bitbucket`, add it to the `publishers` array in your [Forge configuration](../configuration.mdx):

```javascript title="forge.config.js"
module.exports = {
  // ...
  publishers: [
    {
      name: '@electron-forge/publisher-bitbucket',
      config: {
        repository: {
          owner: 'myusername',
          name: 'myreponame'
        },
        auth: {
          username: process.env.BITBUCKET_USERNAME, // string
          appPassword: process.env.BITBUCKET_APP_PASSWORD // string
        }
      }
    }
  ]
};
```

Full configuration options are documented in [`PublisherBitbucketConfig`](https://js.electronforge.io/interfaces/\_electron\_forge\_publisher\_bitbucket.PublisherBitbucketConfig.html).

:::info
Your artifacts can be found under the `Downloads` tab of your Bitbucket repository.
:::
