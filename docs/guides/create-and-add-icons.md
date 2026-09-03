---
description: >-
  The purpose of this guide is to walk through the process of generating and
  setting an app icon, as well as setting installer and setup icons.
---

# Custom App Icons

## Generating an icon

Generating your icon can be done using various conversion tools found online. It is recommended to start with a 1024x1024px image before converting it to the formats required by each platform.

### Supporting higher pixel densities

On platforms that have high-DPI support (such as Apple Retina displays), you can append `@2x` after the image's base filename to mark it as a high resolution image. For example, if `icon.png` is a normal image with standard resolution, then `icon@2x.png` will be treated as a high resolution image that has double the DPI intensity.

If you want to support different displays with different DPI densities at the same time, you can put images with different sizes in the same folder and use the filename without DPI suffixes. For example:

```text
images/
├── icon.png
├── icon@2x.png
└── icon@3x.png
```

:::info
The following suffixes for DPI are also supported:

@1x, @1.25x, @1.33x, @1.4x, @1.5x, @1.8x, @2x, @2.5x, @3x, @4x, and @5x.
:::

### Supported formats

The recommended file formats and icon sizes for each platform are as follows:

| Operating system | Format                      | Size / notes                                                                                                               |
| ---------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| macOS            | `.icns` (or `.icon`)        | Use a 1024x1024 source image. Keep an `.icns` file for compatibility, and add an Icon Composer `.icon` file for macOS 26+. |
| Windows          | `.ico`                      | 256x256 pixels                                                                                                             |
| Linux            | `.png`                      | 512x512 pixels                                                                                                             |

:::warning
On Windows, ensure that your `.ico` file is exported from an image editor that supports the format (such as [GIMP](https://www.gimp.org/)). Renaming a `.png` file into `.ico` will result in a `Fatal error: Unable to set icon` error.
:::

:::info
`@electron/packager` supports macOS Icon Composer files as of [`@electron/packager` v18.4.0](https://github.com/electron/packager/releases/tag/v18.4.0). To support both macOS 26+ and earlier releases, provide both an `.icns` file and a `.icon` file.
:::

## Setting the app icon

### Windows

Configuring the path to your icon can be done in your Forge configuration.

```javascript title="forge.config.js"
module.exports = {
  // ...
  packagerConfig: {
    icon: '/path/to/icon' // no file extension required
  }
  // ...
};
```

:::tip
When you provide a single icon path, Electron Packager will automatically add the correct platform extension, so appending `.ico` here is not required.
:::

After the config has been updated, build your project to generate your executable with the Make command.

### macOS

If you only need the traditional macOS icon format, you can continue to provide a single `icon` path in `packagerConfig`:

```javascript title="forge.config.js"
module.exports = {
  // ...
  packagerConfig: {
    icon: '/path/to/icon' // .icns will be inferred
  }
  // ...
};
```

If you need one configuration that supports both macOS 26+ and earlier macOS releases, provide both an `.icns` file and an `.icon` file:

```javascript title="forge.config.js"
module.exports = {
  // ...
  packagerConfig: {
    icon: [
      '/path/to/icon.icns',
      '/path/to/icon.icon'
    ]
  }
  // ...
};
```

Electron Packager will use the `.icns` file on macOS versions earlier than 26, and the `.icon` file on macOS 26 and later.

:::warning
Packaging an `.icon` file currently requires macOS 26 or later and Xcode 26 or later because Electron Packager uses Apple's `actool` tool to compile the Icon Composer asset.
:::

:::info
When you provide multiple macOS icon files, include the file extensions explicitly so Packager can distinguish the `.icns` and `.icon` inputs.
:::

After the config has been updated, build your project to generate your executable with the Make command.

### Linux

Configuring the path to your icon must be done in both package.json as well as in Electron's main process.

```javascript title="forge.config.js" {14}
module.exports = {
  // ...
  makers: [
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: '/path/to/icon.png'
        }
      }
    }
  ]
  // ...
};
```

The icon must be additionally loaded when instantiating your [BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions).

```javascript title="main.js (Main Process)" {5}
const { BrowserWindow } = require('electron');

const win = new BrowserWindow({
  // ...
  icon: '/path/to/icon.png'
});
```

Once the path to the icon has been configured, build your project to generate your executable with `npm run make`.

## Configuring installer icons

Installers usually have icons! Don't forget to configure those in the Maker-specific config within the [Makers section of your Forge configuration](https://www.electronforge.io/config/makers).

Here is an example of how that can be done:

```javascript
// forge.config.js
module.exports = {
  // ...
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // An URL to an ICO file to use as the application icon (displayed in Control Panel > Programs and Features).
        iconUrl: 'https://url/to/icon.ico',
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: '/path/to/icon.ico'
      }
    },
    {
      // Path to a single image that will act as icon for the application
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: '/path/to/icon.png'
        }
      }
    },
    {
      // Path to the icon to use for the app in the DMG window
      name: '@electron-forge/maker-dmg',
      config: {
        icon: '/path/to/icon.icns'
      }
    },
    {
      name: '@electron-forge/maker-wix',
      config: {
        icon: '/path/to/icon.ico'
      }
    }
  ]
  // ...
};
```

Once again, once you are done configuring your icons, don't forget to build your project with the Make command.

## Troubleshooting

Operating systems have an icon cache. Resetting the cache is recommended if the icon is not updated or still uses the default one.

### Refreshing the icon cache (Windows)

Windows caches all application icons in a hidden Icon Cache Database. If your Electron app's icon is not showing up, you may need to rebuild this cache. To invalidate the cache, use the system `ie4uinit.exe` utility:

```sh
ie4uinit.exe -show
```
