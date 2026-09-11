---
description: Set up your Forge configuration to use TypeScript
---

# TypeScript Setup

## Installation

As of [Forge v7.8.1](https://github.com/electron/forge/releases/tag/v7.8.1), Electron Forge loads `forge.config.ts` files without any additional configuration using [`jiti`](https://github.com/unjs/jiti).

:::warning
For older versions, follow the [Alternate file syntaxes](typescript-configuration.md#alternate-file-syntaxes) section below with the [`ts-node`](https://github.com/TypeStrong/ts-node) package.
:::

## Configuration file

Forge's TypeScript format is functionally identical to `forge.config.js`. Types can be imported from the [`@electron-forge/shared-types`](https://www.npmjs.com/package/@electron-forge/shared-types) package.

```typescript title="forge.config.ts"
import type { ForgeConfig } from '@electron-forge/shared-types';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    osxSign: {}
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        authors: "Electron contributors"
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {}
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {}
    },
  ]
};

export default config;
```

## Using module constructor syntax

When using a TypeScript configuration file, you may want to have stronger type validation around the individual options for each Maker, Publisher, or Plugin.

To achieve this, you can import each module's constructor, which accepts its config object as the first parameter and the list of target platforms as the second parameter.

For example, the below configuration is equivalent to the `makers` array from the example above:

```typescript title="forge.config.ts"
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';

const config: ForgeConfig = {
  makers: [
    new MakerSquirrel({
      authors: 'Electron contributors'
    }, ['win32']),
    new MakerZIP({}, ['darwin']),
    new MakerDeb({}, ['linux']),
    new MakerRpm({}, ['linux']),
  ]
};

export default config;
```

## Alternate file syntaxes

Forge also supports configuration files in other languages that transpile down to JavaScript as long as a module loader for that language is installed locally in your project's `devDependencies`. For example, installing `coffeescript` enables Forge to read from a `forge.config.ts` file.

These configuration files follow the same format as `forge.config.js`.

:::info
The transpiler module you use needs to be compatible with [`interpret`](https://github.com/gulpjs/interpret) to work.
:::
