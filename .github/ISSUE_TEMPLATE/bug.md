---
name: Bug report
about: Create a report to help us improve Electron Forge
labels: "Bug"
---

### Preflight Checklist
<!-- Please ensure you've completed the following steps by replacing [ ] with [x]-->

* [ ] I have read the [contribution documentation](https://github.com/electron-userland/electron-forge/blob/master/CONTRIBUTING.md) for this project.
* [ ] I agree to follow the [code of conduct](https://github.com/electron/electron/blob/master/CODE_OF_CONDUCT.md) that this project follows, as appropriate.
* [ ] I have searched the issue tracker for a bug that matches the one I want to file, without success.

### Issue Details

* **Electron Forge Version:**
  * <!-- (output of `node_modules/.bin/electron-forge --version`) e.g. 6.0.0-beta.45 -->
* **Electron Version:**
  * <!-- (output of `node_modules/.bin/electron --version`) e.g. 4.0.3 -->
* **Operating System:**
  * <!-- (Platform and Version) e.g. macOS 10.13.6 / Windows 10 (1803) / Ubuntu 18.04 x64 -->
* **Last Known Working Electron Forge version:**:
  * <!-- (if applicable) e.g. 6.0.0-beta.44 -->

### Expected Behavior
<!-- A clear and concise description of what you expected to happen. -->

### Actual Behavior
<!-- A clear and concise description of what actually happened. -->

### To Reproduce
<!--
Your best chance of getting this bug looked at quickly is to provide a MINIMAL REPOSITORY that can be cloned and run. Also include:
* if you are using the `electron-packager` CLI: the command line arguments you are passing
* if you are using the API the parameters are you passing to the `packager()` function
-->

### Additional Information
<!--
Add any other context about the problem here.

For example:
* Console output when you run your `electron-forge` command with the environment variable
  `DEBUG=electron-forge:*`. (Instructions on how to do so
  [here](https://www.npmjs.com/package/debug#usage)). Please include the stack trace if
  one exists.
* Command line arguments you are passing to `electron-forge` (e.g.,
  `electron-forge make --not-a-real-flag`)
* The `config.forge` data in `package.json` or `forge.config.js` in use
* A failing minimal testcase (with a link to the code) or detailed steps to reproduce the problem.
  Using `electron-forge init` is a good starting point, if that is not the source of your problem.
