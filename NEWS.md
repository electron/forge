# Changes by Version

## Unreleased

## [0.0.9] - 2016-12-10

### Added

* Map Electron Packager `afterExtract` hooks to `require` calls

## [0.0.8] - 2016-12-10

### Added

* Flatpak support for the `make` subcommand (#6)

## [0.0.7] - 2016-12-07

### Fixed

* Add `electron-compile` to the prod dependencies of the initialized app
* Spawn the `zip` command in the containing directory
* Pass through parent environment to the started application

## [0.0.6] - 2016-12-04

### Added

* Windows.Squirrel support for `make` subcommand
* DMG support for the `make` subcommand
* Debian support for the `make` subcommand (#4)
* RPM support for the `make` subcommand

### Fixed

* Throw error when `electron-prebuilt-compile` not found (#2)

## [0.0.5] - 2016-12-03

### Added

* `make` subcommand, with support for zips

### Fixed

* Show linter error if Electron app not found

## [0.0.4] - 2016-12-02

### Fixed

* Launching an app via `start`

## [0.0.3] - 2016-12-02

### Added

* `forge` CLI alias
* Support for using `yarn` to install dependencies

### Changed

* Only support Node 6
* Electron Packager is invoked via its API instead of its CLI

## [0.0.2] - 2016-10-05

### Added

* Debug logging when using the `start` subcommand

## 0.0.1 - 2016-10-05

Initial release.

[0.0.9]: https://github.com/MarshallOfSound/electron-forge/compare/v0.0.8...v0.0.9
[0.0.8]: https://github.com/MarshallOfSound/electron-forge/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/MarshallOfSound/electron-forge/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/MarshallOfSound/electron-forge/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/MarshallOfSound/electron-forge/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/MarshallOfSound/electron-forge/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/MarshallOfSound/electron-forge/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/MarshallOfSound/electron-forge/compare/v0.0.1...v0.0.2
