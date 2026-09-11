---
description: 'Developing with Windows Subsystem for Linux, on Windows'
---

# Developing with WSL

If you're using [Windows Subsystem for Linux \(WSL\)](https://docs.microsoft.com/en-us/windows/wsl/), there are some quirks to running Electron apps. Since you can run a mostly complete Linux distribution inside it, it justifiably declares itself as Linux when you're inside of it. However, as of February 2021 there is no support for running graphical apps compiled for Linux out of the box. Simply trying to run an Electron app in development that you've installed dependencies in WSL will try and fail to find an X11 server, and thus not launch.

Fortunately, one of the features of WSL is that you can run Windows executables from a WSL terminal seamlessly. The caveat is that you'll need to reinstall Electron in order to pick up the prebuilt binaries for Windows instead of Linux. Inside a WSL terminal, assuming that you've installed Node.js for Linux, you can run:

```bash
# If node_modules exists already that was installed in WSL:

rm -r node_modules

# then:

npm install --platform=win32

# or:

npm_config_platform=win32 npm install

```

Then, start the Electron app in development mode as usual via `npm start`.

For package/make/publish, you'll still need to specify the platform if you want to generate bundles/distributables for Windows.

```bash
npm run make -- --platform=win32
```

:::warning
Some of the dependencies of Electron Forge don't quite work with WSL, as they don't detect that they're running in WSL _\(instead of Linux\)_ and thus tries to run certain tooling provided as Windows executables in... Wine. We are actively working on making the dependent tooling WSL-aware. The workaround is to run package/make/publish outside of WSL.
:::
