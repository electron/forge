---
description: Publishing your Electron app artifacts to a Google Cloud Storage bucket.
---

# Google Cloud Storage

:::info
This Publisher was added in Electron Forge **v7.1.0**.
:::

The Google Cloud Storage target publishes all your artifacts to a [Google Cloud Storage bucket](https://cloud.google.com/storage/docs).

## Installation

```bash
npm install --save-dev @electron-forge/publisher-gcs
```

## Usage

To use `@electron-forge/publisher-gcs`, add it to the `publishers` array in your [Forge configuration](../configuration.mdx):

```javascript title="forge.config.js"
module.exports = {
  // ...
  publishers: [
    {
      name: '@electron-forge/publisher-gcs',
      config: {
        storageOptions: {
          // add additional Storage constructor parameters here
          projectId: 'my-project-id'
        },
        bucket: 'my-bucket',
        folder: 'custom-folder-name',
        public: true
      }
    }
  ]
};
```

Additional configuration options are documented in [`PublisherGCSConfig`](http://js.electronforge.io/interfaces/\_electron\_forge\_publisher\_gcs.PublisherGCSConfig.html).

To pass options into the Google Cloud Storage SDK's [Storage constructor](https://cloud.google.com/nodejs/docs/reference/storage/latest/storage/storageoptions), use the `config.storageOptions` parameter.

### Output location

When executed, the Publisher will publish to your GCS bucket under the following key:

```text
${config.folder || version}/${artifactName}
```

:::warning
If you run publish twice with the same version on the same platform, it is possible for your old artifacts to get overwritten in Storage. It is your responsibility to ensure that you don't overwrite your own releases.
:::

### Authentication

Under the hood, the Google Cloud Storage Publisher uses the `@google-cloud/storage` SDK and its associated authentication options.

We recommend following [Google's authentication documentation for client libraries](https://cloud.google.com/docs/authentication/client-libraries#node.js) to get authentication configured.
