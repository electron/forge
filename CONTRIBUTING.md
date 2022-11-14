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
amount of time to run when uncached. The repository will automatically cache test results for future runs.
Adding `skip-nx-cache` will skip the cache.

```bash
lerna run test
```

Tests can also run within a specific scope.

```bash
lerna run test --scope @electron-forge/core
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

### Release process

- Make sure the tests pass with `lerna run test`
- Run `git clean -fdx` - this will ensure unneeded build files (and potentially sensitive files) are not included in the npm package.
- Ensure that you are logged into npm via command line (`npm login`)
- `lerna publish --force-publish`
  - **running this command without the `--force-publish` flag will only publish packages that have changes since
    last release**.
  - for beta releases, select `custom prerelease` when prompted, and enter `y` to increment the beta version.
  - version numbers should be an un-prefixed [semantic version](https://semver.org/) number (e.g. `6.0.0-beta.67)
  - The script will then ask you for your `npm` OTP password.
  - The script will commit the changes automatically. Run `git log` to confirm that the changes have been
    committed.
- The command will have published your packages to `npm`, and pushed an appropriate tag to github.
- After running the command, you should have a commit which:
  - Updates the version field in the package.json file
  - Updates the version fields in each of the submodule package.json files
- Push your commit upstream to the main/default branch.
- Create a new github release
  - Go to releases tab
  - Draft a new release and choose the appropriate tag
  - Target default branch
  - Generate release notes by copying in CHANGELOG.md contents into the release description or use
    GitHub's [automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)
