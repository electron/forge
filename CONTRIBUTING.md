# Contributing to Electron Forge

Electron Forge is a community-driven project. As such, we welcome and encourage all sorts of
contributions. They include, but are not limited to:

* Constructive feedback
* [Questions about usage](#questions-about-usage)
* [Bug reports / technical issues](#before-opening-bug-reportstechnical-issues)
* [Documentation changes](#documentation-changes)
* Feature requests
* [Pull requests](#filing-pull-requests)

We strongly suggest that before filing an issue, you search through the existing issues to see
if it has already been filed by someone else.

This project is a part of the Electron ecosystem. As such, all contributions to this project follow
[Electron's code of conduct](https://github.com/electron/electron/blob/master/CODE_OF_CONDUCT.md)
where appropriate.

## Questions about usage

If you have questions about usage, we encourage you to visit one of the several [community-driven
sites](https://github.com/electron/electron#community).

## Before opening bug reports/technical issues

### Debugging

Troubleshooting suggestions can be found in the [support
documentation](https://github.com/electron-userland/electron-forge/blob/master/SUPPORT.md#troubleshooting).

## Contribution suggestions

We use the label [`help wanted`](https://github.com/electron-userland/electron-forge/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22)
in the issue tracker to denote fairly-well-scoped-out bugs or feature requests that the community
can pick up and work on. If any of those labeled issues do not have enough information, please feel
free to ask constructive questions. (This applies to any open issue.)

## Documentation changes

When changing the API documentation, here are some rules to keep in mind.

* The first line:
  * should end with a period
  * should be in imperative mood (e.g., "Create" instead of "Creates")
  * First line should not be the function's "signature"
* The first word of the first line:
  * should be properly capitalized
  * should not be "This"

For changes to the website ([electronforge.io](https://electronforge.io)), please file
issues/pull requests at [its separate repository](https://github.com/electron-forge/electronforge.io).

## Filing Pull Requests

Here are some things to keep in mind as you file pull requests to fix bugs, add new features, etc.:

* Travis CI is used to make sure that the project builds packages as expected on the supported
  platforms, using supported Node.js versions, and that the project conforms to the configured
  coding standards.
* Unless it's impractical, please write tests for your changes. This will help us so that we can
  spot regressions much easier.
* If your PR changes the behavior of an existing feature, or adds a new feature, please add/edit
  the package's documentation.
* One of the philosophies of the project is to keep the code base as small as possible. If you are
  adding a new feature, think about whether it is appropriate to go into a separate Node module,
  and then be integrated into this project.
* Please **do not** bump the version number in your pull requests, the maintainers will do that.
  Feel free to indicate whether the changes require a major, minor, or patch version bump, as
  prescribed by the [semantic versioning specification](http://semver.org/).
* This project uses `git-cz` to generate commit messages. To make commits, please run
  `npm run commit`.
* If you are continuing the work of another person's PR and need to rebase/squash, please retain the
  attribution of the original author(s) and continue the work in subsequent commits.

### Release process

- if you aren't sure if a release should happen, open an issue
- make sure the tests pass
- `npm run release:(patch|minor|major)`
- create a new GitHub release from the pushed tag with the contents of `CHANGELOG.md` for that version
- close the milestone associated with the version if one is open
