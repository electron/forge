## Electron Forge: Publisher Bitbucket

`@electron-forge/publisher-bitbucket` publishes your artifacts to Bitbucket where users will be able to download them.

This publish target is for Bitbucket Cloud only and will not work with self hosted Bitbucket Server instances.

Configuration options are documented in [`PublisherBitbucketConfig`](https://js.electronforge.io/interfaces/_electron_forge_publisher_bitbucket.PublisherBitbucketConfig.html).


```javascript title=forge.config.js
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
          username: 'myusername',
          appPassword: 'mysecretapppassword'
        }
    }
  ]
}
```

Alternatively you can (and should) use environment variables for the authentication

```
//env.sh
BITBUCKET_USERNAME="myusername"
BITBUCKET_APP_PASSWORD="mysecretapppassword"
```

```
source env.sh
```