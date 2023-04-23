# Contributing to Electron Forge

Electron Forge is a community-driven project. As such, we welcome and encourage all sorts of
contributions. They include, but are not limited to:

- Constructive feedback
- [Questions about usage](#questions-about-usage)
- [Bug reports / technical issues](#before-opening-bug-reportstechnical-issues)
- [Documentation changes](#documentation-changes)
- Feature requests
- [Pull requests](#filing-pull-requests)

We strongly suggest that before filing an issue, you search through existing issues to see
if it has already been filed by someone else.

This project is a part of the Electron ecosystem. As such, all contributions to this project follow
[Electron's code of conduct](https://github.com/electron/electron/blob/main/CODE_OF_CONDUCT.md)
where appropriate.

## Questions about usage

If you have questions about usage, we encourage you to visit one of the several [community-driven
sites](https://github.com/electron/electron#community).

## Before opening bug reports/technical issues

### Debugging

Troubleshooting suggestions can be found in the [support
documentation](https://github.com/electron/forge/blob/main/SUPPORT.md#troubleshooting).

## Contribution suggestions

We use the label [`help wanted`](https://github.com/electron/forge/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22)
in the issue tracker to denote fairly-well-scoped-out bugs or feature requests that the community
can pick up and work on. If any of those labeled issues do not have enough information, please feel
free to ask constructive questions. (This applies to any open issue.)

## Running Forge locally

The easiest way to test changes to Forge during development is by symlinking your local packages
to a sample Forge project.

To create symlinks your local Forge packages, use the `yarn link:prepare` command after
building Forge.

```sh
yarn build
yarn link:prepare
```

Then, you want to initialize a new project with the `electron-forge init` command (which is the
underlying CLI command for `create-electron-app`). To use the symlinks you created in the last step,
pass in the `LINK_FORGE_DEPENDENCIES_ON_INIT=1` environment variable.

You can choose to run this command via your local build as shown below or run the production init
for versions 6.0.1 and up.

```sh
LINK_FORGE_DEPENDENCIES_ON_INIT=1 node path/to/forge/packages/api/cli/dist/electron-forge-init.js my-app
```

Forge commands executed in your `my-app` sample project should reflect any changes in your local
Forge build. (Make sure to run `yarn build:fast` or `yarn build` between code changes.)

## Documentation changes

When changing the API documentation, here are some rules to keep in mind.

- The first line:
  - should end with a period
  - should be in imperative mood (e.g., "Create" instead of "Creates")
  - First line should not be the function's "signature"
- The first word of the first line:
  - should be properly capitalized
  - should not be "This"

For changes to the website ([electronforge.io](https://www.electronforge.io)), please file
issues/pull requests at [its separate repository](https://github.com/electron-forge/electron-forge-docs).

## Changing the Code

An example of how to make your own code edits:

```bash
git clone https://github.com/electron/forge
cd forge
# Installs all dependencies
yarn
# Builds all the TS code
yarn build
```

### Making Commits

Please ensure that all changes are committed using [semantic commit messages](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md).

### Running the Tests

The Electron Forge repository has a lot of tests, some of which take a decent
amount of time to run.

```bash
yarn test
```

## Filing Pull Requests

Here are some things to keep in mind as you file pull requests to fix bugs, add new features, etc.:

- GitHub Actions are used to make sure that the project builds packages as expected on the
  supported platforms, using supported Node.js versions, and that the project conforms to the
  configured coding standards.
- Unless it's impractical, please write tests for your changes. This will help us so that we can
  spot regressions much easier.
- If your PR changes the behavior of an existing feature, or adds a new feature, please add/edit
  the package's documentation.
- Commit messages and pull request titles should adhere to the [Conventional Commits
  format](https://www.conventionalcommits.org/en/v1.0.0/).
- One of the philosophies of the project is to keep the code base as small as possible. If you are
  adding a new feature, think about whether it is appropriate to go into a separate Node module,
  and then be integrated into this project.
- Please **do not** bump the version number in your pull requests, the maintainers will do that.
  Feel free to indicate whether the changes are a breaking change in behavior.
- If you are continuing the work of another person's PR and need to rebase/squash, please retain the
  attribution of the original author(s) and continue the work in subsequent commits.

## Release process

This guide is for maintainers who have:

- Push access to the `electron/forge` repository.
- Collaborator access to the `@electron-forge` packages on npm.

### 1. Prepare your local code checkout

- Switch to the tip of the `main` branch with `git switch main && git pull`.
- Run tests locally with `yarn test`.
- Check that the latest CI run passed on `main` on [GitHub](https://github.com/electron/forge/actions?query=workflow:CI).
- Remove all untracked files and directories from your checkout with `git clean -fdx`.
- Install dependencies with `yarn install`.

### 2. Publish all npm packages

- Log into npm with `npm login`.
- Run the `yarn lerna:publish` command.
- Enter your npm account's time-based one-time password (TOTP).

The `lerna:publish` script will automatically increment the next package version based on the
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard. From there, it does two things:

1. It creates a tagged commit that bumps the version number in `package.json` at the root and package levels
   and pushes the commit and tag to GitHub.
1. It publishes every `@electron-forge/` package to npm.

### 3. Publish release to GitHub

- Go to the repo's [New Release](https://github.com/electron/forge/releases/new) page.
- Select tag you just published.
- Target the `main` branch.
- [Automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)
  against the previous Forge release.
