## publisher-s3

`@electron-forge/publisher-s3` publishes all your artifacts to Amazon S3 or Cloudflare R2 buckets where users will be able to download them.

By default, all files are positioned at the following key:

${config.folder || appName}/${platform}/${arch}/${artifactName}

Configuration options are documented in [PublisherS3Config](https://js.electronforge.io/interfaces/_electron_forge_publisher_s3.PublisherS3Config.html).

### AWS S3 Usage

```javascript title=forge.config.js
module.exports = {
  // ...
  publishers: [
    {
      name: '@electron-forge/publisher-s3',
      config: {
        provider: 's3', // optional, 's3' is the default
        bucket: 'my-bucket',
        public: true
      }
    }
  ]
};
```

#### Authentication

It is recommended to follow the [Amazon AWS guide](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html) and set either a shared credentials guide or the proper environment variables. However, if that is not possible, the publisher config allows the setting of the accessKeyId and secretAccessKey configuration options.

### Cloudflare R2 Usage

```javascript title=forge.config.js
module.exports = {
  // ...
  publishers: [
    {
      name: '@electron-forge/publisher-s3',
      config: {
        provider: 'r2',
        bucket: 'my-bucket',
        accountId: 'your-cloudflare-account-id',
        accessKeyId: 'your-r2-access-key-id',
        secretAccessKey: 'your-r2-secret-access-key'
      }
    }
  ]
};
```

#### Authentication

This publisher uses Cloudflare R2's S3-compatible API. You need to provide R2 API credentials:

1. **Account ID**: Found in the Cloudflare dashboard URL or on the R2 overview page
2. **API Tokens**: Create R2 API tokens from the R2 dashboard:
   - Go to R2 → Manage R2 API Tokens
   - Click "Create API token"
   - Select permissions (Read & Write)
   - Copy the `Access Key ID` and `Secret Access Key`

#### Public Access

To make your artifacts publicly accessible, configure a custom domain for your R2 bucket in the Cloudflare dashboard under R2 → Settings → Public Access.

### Custom Key Resolver

You can customize the key for uploaded artifacts by providing a `keyResolver` function:

```javascript
config: {
  bucket: 'my-bucket',
  keyResolver: (fileName, platform, arch) => {
    return `releases/${platform}/${arch}/${fileName}`;
  }
}
```

### Notes

If you run publish twice with the same version on the same platform, it is possible for your old artifacts to get overwritten. It is your responsibility to ensure that you don't overwrite your own releases.
