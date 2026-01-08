## publisher-r2

`@electron-forge/publisher-r2` publishes all your artifacts to a Cloudflare R2 bucket where users will be able to download them.

By default, all files are positioned at the following key:

${config.folder || appVersion}/${platform}/${arch}/${artifactName}

Configuration options are documented in [PublisherR2Config](https://js.electronforge.io/interfaces/_electron_forge_publisher_r2.PublisherR2Config.html).

```javascript title=forge.config.js
module.exports = {
  // ...
  publishers: [
    {
      name: '@electron-forge/publisher-r2',
      config: {
        bucket: 'my-bucket',
        accountId: 'your-cloudflare-account-id',
        apiToken: 'your-cloudflare-api-token'
      }
    }
  ]
};
```

If you run publish twice with the same version on the same platform, it is possible for your old artifacts to get overwritten in R2. It is your responsibility to ensure that you don't overwrite your own releases.

### Authentication

This publisher uses the wrangler npm package to interact with Cloudflare R2. You need to provide your Cloudflare API credentials in the configuration:

```javascript
config: {
  accountId: 'your-cloudflare-account-id',
  apiToken: 'your-cloudflare-api-token',
  bucket: 'my-bucket',
  // ...
}
```

#### Getting Your Credentials

- **Account ID**: Found in the Cloudflare dashboard URL or on the R2 overview page
- **API Token**: Create a token with R2 read and write permissions from the [Cloudflare API Tokens page](https://dash.cloudflare.com/profile/api-tokens). Make sure the token has "Account.R2 Storage" permissions.

### Public Access

To make your artifacts publicly accessible, configure a custom domain for your R2 bucket in the Cloudflare dashboard. Public access is managed entirely through Cloudflare's R2 bucket settings, not through this publisher.

### Custom Key Resolver

You can provide a custom function to determine the key (path) for each artifact:

```javascript
config: {
  bucket: 'my-bucket',
  keyResolver: (fileName, platform, arch) => {
    return `releases/v1.0.0/${platform}/${fileName}`;
  }
}
```
