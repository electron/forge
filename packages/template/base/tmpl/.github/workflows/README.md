# Electron Forge: CI Template

Electron Forge provides a sample GitHub Actions config and the supporting scripts that you can use to bundle and generate app installers quickly. You can import these files into your project by using the `--copy-ci-files` flag when creating a new project.

```
npx create-electron-app my-new-app --copy-ci-files
# or
yarn create electron-app my-new-app --copy-ci-files
```

The sample GitHub Actions build.yml file contains three jobs:

**Lint:** Runs `yarn lint` by default.

**Build:** Bundles your app for Mac, Windows and Linux, using the electron-forge/bundle-action.

**Installers:** Creates distributable installers, using the electron-forge/distributable-action@main. Currently supports squirrel, zip, DMG, deb and rpm.

### Code-Signing Options

The bundle and installer jobs allow you to code-sign your app, using specific variables. You can see examples of code-signing for Mac in the bundle job here:

```
// bundle job
- name: Bundle app
  uses: electron-forge/bundle-action@main
  with:
    macos-cert-importer: ci/codesign/import-testing-cert-ci.sh

// installer job
- name: Generate distributables
  uses: electron-forge/distributable-action@main
  with:
    macos-cert-importer: ci/codesign/import-testing-cert-ci.sh
    windows-cert-filename: ci/codesign.pfx
    windows-cert-importer: ci/setup-windows-certificate.sh
```

Code-signing requires using the included scripts in the `ci` folder. You can substitute the existing sample codesign.pfx file with your own .pfx file, or create a testcertificate using the included script.
