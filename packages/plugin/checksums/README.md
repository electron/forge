
# Checksums Plugin

The Checksums plugin adds two files to every `make` run, for each platform and arch:

- `SHA256SUMS-<platform>-<arch>.txt`, the SHA-256 hash of every artifact, in the format `sha256sum -c` reads.
- `<name>-<version>-<platform>-<arch>.cdx.json`, a [CycloneDX](https://cyclonedx.org/) 1.5 SBOM that lists Electron and every npm package shipped inside your app.

The files are added to the make results, so every [publisher](https://www.electronforge.io/config/publishers) uploads them next to your installers without any extra configuration, and `release --from-make` picks them up too.

## Installation

```shell
npm install --save-dev @electron-forge/plugin-checksums
```

## Usage

Add the plugin to the [`plugins`](https://www.electronforge.io/config/configuration#plugins) array in your Forge configuration.

```javascript title="forge.config.js"
module.exports = {
  plugins: [
    {
      name: '@electron-forge/plugin-checksums',
      config: {
        algorithm: 'sha256', // or 'sha512'
        sbom: true
      }
    }
  ]
};
```

All configuration options are documented in [`ChecksumsPluginConfig`](https://js.electronforge.io/interfaces/_electron_forge_plugin_checksums.ChecksumsPluginConfig.html).

Users can then check a download like this:

```shell
sha256sum --ignore-missing -c SHA256SUMS-linux-x64.txt
```

## Limitations

- The SBOM lists the packages in your packaged app's `node_modules` folder. If you use the [Vite](https://www.electronforge.io/config/plugins/vite) or [webpack](https://www.electronforge.io/config/plugins/webpack) plugin, packages that the bundler inlined into your bundles are not in that folder and are not listed.
- The SBOM is built while packaging. `make --from-package` skips packaging, so it only writes the checksum file.
