# Support for Electron Forge

If you have questions about usage, check out the [website](https://www.electronforge.io/).

## Troubleshooting

One way to troubleshoot potential problems is to set the `DEBUG` environment variable before
running `electron-forge`. This will print debug information from the specified modules. The
value of the environment variable is a comma-separated list of modules which support this logging
feature. Known modules include:

- `@electron/get:*`
- `@electron/osx-sign`
- `@electron/packager`
- `electron-forge:*` (always use this one before filing an issue)
- `electron-installer-debian`
- `electron-installer-dmg`
- `electron-installer-flatpak`
- `electron-installer-redhat`
- `electron-installer-snap:*`
- `electron-rebuild`
- `electron-windows-installer:main`
- `electron-windows-store`
- `extract-zip`
- `get-package-info`

We use the [`debug`](https://www.npmjs.com/package/debug#usage) module for this functionality. It
has examples on how to set environment variables if you don't know how.

**If you are using `npm run` to execute `electron-forge`, run the `electron-forge` command
without using `npm run` and make a note of the output, because `npm run` does not print out error
messages when a script errors.**
