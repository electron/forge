---
description: Create a new Electron app with webpack.
---

# Webpack

To get you up and running as fast as possible with the [webpack](https://webpack.js.org) bundler, we provide a template that makes use of the [`@electron-forge/plugin-webpack` module](../config/plugins/webpack.mdx), plus some preset webpack configuration options.

```bash
npx create-electron-app@latest my-new-app --template=webpack
```

To use [TypeScript](https://www.typescriptlang.org/), add the `--typescript` flag:

```bash
npx create-electron-app@latest my-new-app --template=webpack --typescript
```

:::info
Before Forge 8, TypeScript was a separate `webpack-typescript` template. That template name now fails with a message pointing to `--template=webpack --typescript`.
:::

:::warning
There have been reports that using the Git Bash command line on Windows with the webpack template prevents the Electron app from rendering (packaged apps are fine). We recommend that on Windows, you use CMD.exe, PowerShell, or [WSL2](../guides/developing-with-wsl.md).
:::

Once you've initialized the template, you'll need to run `npm start` in the generated directory. See the [Webpack Plugin](../config/plugins/webpack.mdx) documentation for Electron Forge-specific configuration options.
