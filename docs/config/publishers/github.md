# GitHub

The GitHub Publisher uploads your artifacts to GitHub Releases, which allows your users to download the files straight from your repository. If your repository is open-source, you can use [update.electronjs.org](https://github.com/electron/update.electronjs.org) to get a free hosted update service (see [Auto updating from GitHub](github.md#auto-updating-from-github) below).

## Installation

```bash
npm install --save-dev @electron-forge/publisher-github
```

## Usage

To use `@electron-forge/publisher-github`, add it to the `publishers` array in your [Forge configuration](../configuration.mdx):

```javascript title="forge.config.js"
module.exports = {
  // ...
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'me',
          name: 'awesome-thing'
        },
        prerelease: true
      }
    }
  ]
};
```

Configuration options are documented in [`PublisherGitHubConfig`](https://js.electronforge.io/interfaces/_electron_forge_publisher_github.PublisherGitHubConfig.html).

### Authentication

We recommend using the `process.env.GITHUB_TOKEN` environment variable to authenticate the GitHub Publisher. This token requires write permissions to your repository's contents to create new releases.

:::info
If you are publishing your app with GitHub Actions,  the `GITHUB_TOKEN` secret is pre-populated in every workflow. You will need to grant the necessary permissions via the `permissions` field at the top level of your workflow configuration.

```yaml
permissions:
  contents: write
```

See the [Controlling permissions for GITHUB\_TOKEN](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token) documentation for more information.
:::

### Uploading to GitHub Enterprise instances

You can use this target to publish to GitHub Enterprise using the host configuration options of `octokitOptions`. Check out the configuration options linked above.

### Auto updating from GitHub

Updating from a GitHub release for a **public** repository is as simple as adding the [`update-electron-app`](https://github.com/electron/update-electron-app) module to your app's main process.

```javascript title="main.js"
const { updateElectronApp } = require('update-electron-app');
updateElectronApp(); // additional configuration options available
```

If your GitHub release is in a private repository, you should check our [Auto Update](../../advanced/auto-update.md) guide for alternative solutions.

### Publishing Squirrel.Windows builds for multiple architectures

GitHub Releases only allow one asset per file name, but the [Squirrel.Windows maker](../makers/squirrel.windows.md) names its `RELEASES` and `.nupkg` files identically for every architecture. When a single publish includes Squirrel.Windows artifacts for more than one architecture (for example `x64` and `arm64`), the GitHub Publisher uploads the non-x64 `RELEASES` and `.nupkg` assets with a lowercase `{arch}.` prefix, while x64 keeps the bare file names:

| Architecture | Uploaded asset names |
| --- | --- |
| `x64` | `RELEASES`, `MyApp-1.0.0-full.nupkg` |
| `arm64` | `arm64.RELEASES`, `arm64.MyApp-1.0.0-full.nupkg` |

The package names inside each prefixed `RELEASES` file are rewritten to match, and [update.electronjs.org](https://github.com/electron/update.electronjs.org) serves the matching architecture to your users.

`Setup.exe` names are not changed, so set the `setupExe` option of the Squirrel.Windows maker to include the architecture (for example `MyApp-${version}-win32-${arch} Setup.exe`) to avoid installers for different architectures colliding on the release.

:::note
Assets are only prefixed when the builds for all architectures are published together in one `electron-forge publish` run. If a release already has an asset with the same name, the GitHub Publisher skips it and logs a warning; set `force: true` in the publisher config to overwrite it instead.
:::
