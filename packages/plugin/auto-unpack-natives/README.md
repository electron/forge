## plugin-auto-unpack-natives

This plugin will automatically add all native Node modules in your node_modules folder to the `asar.unpack` config option in your `packagerConfig`. If your app uses native Node modules, you should probably use this to reduce loading times and disk consumption on your users' machines.

```javascript
// forge.config.js

module.exports = {
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    }
  ]
};
```
