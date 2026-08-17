---
description: Create a new Electron app with webpack and TypeScript.
---

# Webpack + Typescript

To get you up and running as fast as possible with [TypeScript](https://www.typescriptlang.org/) and [webpack](https://webpack.js.org/), we provide a template that makes use of the [`@electron-forge/plugin-webpack` module](../config/plugins/webpack.mdx) with sane TypeScript configuration defaults.

```bash
npx create-electron-app@latest my-new-app --template=webpack-typescript
```

:::warning
There have been reports that using the Git Bash command line on Windows specifically with this template will prevent the Electron app from rendering (packaged apps are fine). We recommend that on Windows, you use CMD.exe, PowerShell, or [WSL2](../guides/developing-with-wsl.md).
:::

Once you've initialized the template, you'll need to run `npm start` in the generated directory. See the [Webpack Plugin](../config/plugins/webpack.mdx) documentation for Electron Forge-specific configuration options.
