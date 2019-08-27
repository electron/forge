# @electron-forge/webpack-constants

> Expose electron forges webpack magic constants

This module makes it simple and type safe to use the webpack magic constants
provided by @electron-forge.

## Usage

```ts
import { mainWindowWebpackEntry, mainWindowPreloadWebpackEntry } from "@electron-forge/webpack-constants";

const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: mainWindowPreloadWebpackEntry
  }
});

mainWindow.loadUrl(mainWindowWebpackEntry);
```
