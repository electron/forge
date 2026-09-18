---
description: Build and release your app on GitHub's hosted runners.
---

# GitHub Actions

Electron Forge can scaffold [GitHub Actions](https://docs.github.com/en/actions) workflows that run your whole build pipeline on GitHub's hosted macOS, Windows, and Linux runners, and publish the results to [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) with the [GitHub Publisher](../config/publishers/github.md).

## Adding the workflows

When you create a new app with `create-electron-app`, answer **yes** to the "Would you like to add GitHub Actions workflows that build and release your app?" prompt, or pass the `--copy-ci-files` flag:

```bash
npx create-electron-app@latest my-app --copy-ci-files
```

This does three things:

* copies `build.yml` and `release.yml` into `.github/workflows`, with install and script commands that match the package manager you chose;
* adds `@electron-forge/publisher-github` to your `devDependencies`;
* adds the GitHub Publisher to the `publishers` array of your Forge configuration.

:::tip Existing projects
To add the workflows to an app you already have, scaffold a throwaway app with the flag above and copy its `.github` directory into your project. Then install `@electron-forge/publisher-github` and add it to your `publishers` as shown in the [GitHub Publisher](../config/publishers/github.md) docs.
:::

## The Build workflow

`build.yml` runs on every push to `main` and on every pull request. It runs the [Make](../cli.md#make) command on macOS, Windows, and Linux runners and uploads the distributables from `out/make` as workflow artifacts, so that packaging problems show up before you cut a release.

## The Release workflow

`release.yml` runs whenever you push a tag that starts with `v`. It can also be started by hand from the **Actions** tab of your repository. It runs in two stages:

1. A `make` job runs the [Release](../cli.md#publish) command with `--dry-run` on each platform. A dry run builds all of your distributables and records what would be published to `out/publish-dry-run` without uploading anything. Both directories are uploaded as workflow artifacts.
2. A `publish` job downloads the artifacts from every platform and runs the Release command with `--from-dry-run` once, on Linux. Because everything is published from a single process, all of the distributables land in one GitHub release.

The release is created as a draft named after the `version` field in your `package.json` (with a `v` prefix), so you can review it before publishing it to your users.

### Cutting a release

1. Bump the `version` field in `package.json` and commit the change.
2. Tag the commit with the same version, prefixed with `v`, and push the tag:

   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```

3. Once the workflow finishes, publish the draft release from the **Releases** page of your repository.

## Configuration

### Repository and token

The GitHub Publisher publishes to the repository the workflow runs in by default, so nothing needs to be configured. Set the `repository` option to publish somewhere else. The workflow authenticates with the built-in `GITHUB_TOKEN` secret; the `publish` job is granted `contents: write` permissions so that the token can create releases.

Options such as `draft`, `prerelease`, and `generateReleaseNotes` are documented in [`PublisherGitHubConfig`](https://js.electronforge.io/interfaces/_electron_forge_publisher_github.PublisherGitHubConfig.html).

### Code signing

The workflows do not sign your app. To ship signed builds, store your certificates and passwords as [encrypted secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions), expose them as environment variables on the `make` job, and follow the [Code Signing](code-signing/index.md) guides to configure `packagerConfig`.

### Platforms, architectures, and makers

Each job in the matrix builds for its runner's own platform and architecture. To build for more targets, add runner labels to the `matrix.os` list (for example, an Intel macOS runner alongside `macos-latest`), or pass `--arch` to the Make and Release commands. If you add makers that need extra system packages, install them in the "Install Linux packaging tools" step.
