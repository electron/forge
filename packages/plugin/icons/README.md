
# Icons Plugin

The Icons plugin turns one square PNG into every icon format Electron apps need, and points your Forge configuration at them:

- `icon.icns` for macOS, with sizes from 16 to 1024 pixels, including Retina variants.
- `icon.ico` for Windows, with sizes from 16 to 256 pixels.
- `icon.png` for Linux, 512 pixels by default.

Icons are regenerated only when the source file changes. The plugin has no native dependencies, so it works the same on every platform and in CI.

## Installation

```shell
npm install --save-dev @electron-forge/plugin-icons
```

## Usage

Add the plugin to the [`plugins`](https://www.electronforge.io/config/configuration#plugins) array in your Forge configuration, and point `source` at a square PNG. 1024 × 1024 pixels is recommended.

```javascript title="forge.config.js"
module.exports = {
  plugins: [
    {
      name: '@electron-forge/plugin-icons',
      config: {
        source: 'assets/icon.png'
      }
    }
  ]
};
```

All configuration options are documented in [`IconsPluginConfig`](https://js.electronforge.io/interfaces/_electron_forge_plugin_icons.IconsPluginConfig.html).

## What it configures

The plugin sets `packagerConfig.icon`, replacing any value you set. It also fills in these maker options when you have not set them yourself:

| Maker | Option | File |
| --- | --- | --- |
| [Squirrel.Windows](https://www.electronforge.io/config/makers/squirrel.windows) | `setupIcon` | `icon.ico` |
| [WiX MSI](https://www.electronforge.io/config/makers/wix-msi) | `icon` | `icon.ico` |
| [DMG](https://www.electronforge.io/config/makers/dmg) | `icon` | `icon.icns` |
| [deb](https://www.electronforge.io/config/makers/deb) | `options.icon` | `icon.png` |
| [RPM](https://www.electronforge.io/config/makers/rpm) | `options.icon` | `icon.png` |

Generated files are written to `out/icons` unless you set `outDir`.

The source must be an 8-bit, non-interlaced PNG, which is what design tools export by default.
