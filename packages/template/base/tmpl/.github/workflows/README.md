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

Running the default jobs should result in artifacts saved at the end of the installer job, ready to download and use.

## Code-Signing

Electron Forge's `bundle-action` and `distributable-action` allow you to code-sign your app by setting the needed certificates and private keys as variables in your Action's secrets:

```
// bundle job
- name: Bundle app
  uses: electron-forge/bundle-action@main
  with:
    macos-cert-p12: ${{ secrets.MACOS_CERT_P12 }}
    macos-cert-password: ${{ secrets.MACOS_CERT_PASSWORD }}

// installer job
- name: Generate distributables
  uses: electron-forge/distributable-action@main
  with:
    macos-cert-p12: ${{ secrets.MACOS_CERT_P12 }}
    macos-cert-password: ${{ secrets.MACOS_CERT_PASSWORD }}
    windows-cert-filename: ${{ secrets.WIN32_PFX }}
    windows-cert-p12: ${{ secrets.WIN32_CERT_P12 }}
    windows-cert-password: ${{ secrets.WIN32_CERT_PASSWORD }}

```

The `bundle-action` and `distributable-action` also allow inputting a custom script to import your certificate, using `macos-cert-importer` and `windows-cert-importer`. Pass a path to the custom script in your project's directory to the needed `*-importer` key:

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
    windows-cert-filename: ci/windows-cert.pfx
    windows-cert-importer: ci/setup-windows-certificate.sh

```
