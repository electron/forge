# Vite + TypeScript

:::info
As of Electron Forge v7.5.0, Vite support for Electron Forge has been marked as **experimental** in order to reflect its stage in development and to provide maintainers with the ability to release fixes and improvements rapidly. Future minor releases may contain breaking changes, but migration steps will be listed in release notes.\
\
For more context, see the Electron Forge [v7.5.0 release notes](https://github.com/electron/forge/releases/tag/v7.5.0).
:::

To get you up and running as fast as possible with [TypeScript](https://www.typescriptlang.org/) and [Vite](https://vitejs.dev/), we provide a template that makes use of the [`@electron-forge/plugin-vite` module](../config/plugins/vite.mdx) with sane TypeScript configuration defaults.

```bash
npx create-electron-app@latest my-new-app --template=vite-typescript
```

Once you've initialized the template, you'll need to run `npm start` in the generated directory.

See the [Vite Plugin](../config/plugins/vite.mdx) documentation for Electron Forge-specific configuration options.
