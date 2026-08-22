---
description: Create a ZIP archive for your Electron app using Electron Forge.
---

# ZIP

The ZIP target builds basic [.zip archives](https://en.wikipedia.org/wiki/ZIP\_\(file\_format\)) containing your packaged application. There are no platform-specific dependencies for using this maker and it will run on any platform.

## Installation

```bash
npm install --save-dev @electron-forge/maker-zip
```

## Usage

To use `@electron-forge/maker-zip`, add it to the `makers` array in your Forge configuration.

```javascript title="forge.config.js"
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-zip'
    }
  ]
};
```

All configuration options are optional, and options are documented in the API docs for [MakerZIPConfig](https://js.electronforge.io/interfaces/\_electron\_forge\_maker\_zip.MakerZIPConfig.html).

### Static file auto-updates (macOS)

On macOS, the ZIP maker can be configured to generate update manifests to use with Electron's [autoUpdater](https://electronjs.org/docs/latest/api/auto-updater) module.

```javascript title="forge.config.js"
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-zip',
      config: (arch) => ({
        macUpdateManifestBaseUrl: `https://my-bucket.s3.amazonaws.com/my-app-updates/darwin/${arch}`
      })
    }
  ]
};
```

`macUpdateManifestBaseUrl` should be a path to an object storage bucket where you are storing your release assets. This bucket needs to be organized in folders by platform, then architecture.

The first time you run `make` with this parameter configured, an architecture-specific `RELEASES.json` manifest will be generated. For example, if you are building v1.2.1 of `my-app` for arm64 (Apple Silicon):

```json title="forge.config.js"
{
  "currentRelease": "1.2.1",
  "releases": [
    {
      "version": "1.2.1",
      "updateTo": {
        "version": "1.2.1",
        "pub_date": "2013-09-18T12:29:53+01:00",
        "name": "my-app v1.2.1",
        "url": "https://my-bucket.s3.amazonaws.com/my-app-updates/darwin/arm64/my-app-1.2.1-darwin-arm64.zip"
      }
    }
  ]
}
```

Once this asset is uploaded to the bucket, subsequent runs will read from the existing manifest at `https://my-bucket.s3.amazonaws.com/my-app-updates/darwin/arm64/RELEASES.json` and modify it to update the `currentRelease` property to the next version that is built.

For end-to-end instructions on this process, including how to publish assets to S3 and set up the autoUpdater to read the `RELEASES.json` manifest, see the [Auto updating from S3](../publishers/s3.mdx#auto-updating-from-s3) guide.
