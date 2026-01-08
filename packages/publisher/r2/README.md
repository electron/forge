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
        accessKeyId: 'your-r2-access-key-id',
        secretAccessKey: 'your-r2-secret-access-key'
      }
    }
  ]
};
```

If you run publish twice with the same version on the same platform, it is possible for your old artifacts to get overwritten in R2. It is your responsibility to ensure that you don't overwrite your own releases.

### Authentication

This publisher uses Cloudflare R2's S3-compatible API. You need to provide R2 API credentials:

```javascript
config: {
  accountId: 'your-cloudflare-account-id',
  accessKeyId: 'your-r2-access-key-id',
  secretAccessKey: 'your-r2-secret-access-key',
  bucket: 'my-bucket',
  // ...
}
```

#### Getting Your Credentials

1. **Account ID**: Found in the Cloudflare dashboard URL or on the R2 overview page
2. **API Tokens**: Create R2 API tokens from the R2 dashboard:
   - Go to R2 → Manage R2 API Tokens
   - Click "Create API token"
   - Select permissions (Read & Write)
   - Copy the `Access Key ID` and `Secret Access Key`

### Public Access

To make your artifacts publicly accessible, configure a custom domain for your R2 bucket in the Cloudflare dashboard under R2 → Settings → Public Access.

### Custom Key Resolver

You can customize the S3 key for uploaded artifacts by providing a `keyResolver` function:

```javascript
config: {
  bucket: 'my-bucket',
  keyResolver: (fileName, platform, arch) => {
    return `releases/${platform}/${arch}/${fileName}`;
  }
}
```
