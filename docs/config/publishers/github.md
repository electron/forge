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
