## plugin-electronegativity

The Electronegativity plugin integrates Doyensec's Electronegativity tool into the Electron Forge workflow. After packaging your Electron app, it identifies any known misconfigurations and security anti-patterns.

```
// forge.config.js

module.exports = {
  plugins: [
    [
      '@electron-forge/plugin-electronegativity',
      {
        isSarif: true
      }
    ]
  ]
}
```