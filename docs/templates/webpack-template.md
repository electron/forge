---
description: Create a new Electron app with Webpack
---

# Webpack

To get you up and running as fast as possible with the [webpack](https://webpack.js.org) bundler, we provide a template that makes use of the [`@electron-forge/plugin-webpack` module](../config/plugins/webpack.mdx), plus some preset webpack configuration options.  This is by far the quickest way to getting a working webpack setup with Electron.

```bash
npx create-electron-app@latest my-new-app --template=webpack
```

Once you've initialized the template, you'll need to run `npm start` in the generated directory. See the [Webpack Plugin](../config/plugins/webpack.mdx) documentation for Electron Forge-specific configuration options.
