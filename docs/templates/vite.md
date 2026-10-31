---
description: Create a new Electron app with Vite.
---

# Vite

To get you up and running as fast as possible with [Vite](https://vite.dev/), we provide a template that makes use of the [`@electron-forge/plugin-vite` module](../config/plugins/vite.mdx), plus some preset Vite configuration options.

```bash
npx create-electron-app@latest my-new-app --template=vite
```

To use [TypeScript](https://www.typescriptlang.org/), add the `--typescript` flag:

```bash
npx create-electron-app@latest my-new-app --template=vite --typescript
```

:::info
Before Forge 8, TypeScript was a separate `vite-typescript` template. That template name now fails with a message pointing to `--template=vite --typescript`.
:::

Once you've initialized the template, you'll need to run `npm start` in the generated directory.

See the [Vite Plugin](../config/plugins/vite.mdx) documentation for Electron Forge-specific configuration options.
