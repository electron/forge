# Electron Forge Core

This module contains the core logic of Electron Forge and exposes the base
API as a number of simple JS functions.

## Basic Usage

```javascript
import { api } from '@electron-forge/core';

// Package the current directory as an Electron app
api.package(__dirname);
```

The named export `api` has it's methods documented over at [ForgeAPI](https://js.electronforge.io/classes/_electron_forge_core.ForgeAPI.html).
All the methods are async and expose the core forge methods, please note that all
user-side configuration is still done through your forge config file or the "config.forge"
section of your package.json. This API simply let's you call the methods in
node land without using the CLI.

## Error Handling

As all methods return a promise you should handle all rejections, you should note
that rejections will **not** always be errors, in fact we commonly reject our
promises with just strings so do not assume that properties such as `stack` or
`message` will exist on thrown errors.
