## Electron Forge: Publisher S3

`@electron-forge/publisher-s3` publishes all your artifacts to an Amazon S3 bucket where users will be able to download them.

By default, all files are positioned at the following key:

${config.folder || appVersion}/${artifactName}

Configuration options are documented in [PublisherS3Config](https://js.electronforge.io/interfaces/_electron_forge_publisher_s3.PublisherS3Config.html).


```javascript
{
  name: '@electron-forge/publisher-s3',
  config: {
    bucket: 'my-bucket',
    public: true
  }
}
```

If you run publish twice with the same version on the same platform, it is possible for your old artifacts to get overwritten in S3. It is your responsibility to ensure that you don't overwrite your own releases.

### Authentication

It is recommended to follow the [Amazon AWS guide](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html) and set either a shared credentials guide or the proper environment variables. However, if that is not possible, the publisher config allows the setting of the accessKeyId and secretAccessKey configuration options.