# Writing Plugins

An Electron Forge Plugin has to export a single class that extends our base plugin. The base plugin can be depended on by installing`@electron-forge/plugin-base`. It can implement two methods, neither are required.

### `getHooks(): ForgeMultiHookMap`

If implemented this method will be once during plugin initialization inside Forge, this method is called only once and shouldn't result in any side effects being executed.  You must return an object in a similar format to `forgeConfig.hooks`.  i.e. an object map between hook names and an array of hook functions.

The possible hook names and the parameters passed to the hook function you return are documented over in the [Configuration](../../config/configuration.mdx) section of the docs.

```javascript
export default class MyPlugin extends PluginBase {
  getHooks () {
    return {
      prePackage: [this.prePackage]
    };
  }

  prePackage () {
    console.log('running prePackage hook');
  }
}
```

### `startLogic(startOpts: StartOptions): Promise<ChildProcess | false>`

If implemented, this method will be called every time the user runs `electron-forge start`, if you return a `ChildProcess` you can override the built in start logic and Electron Forge will not spawn it's own process, rather it will watch the one you returned. If you return `false` forge will spawn Electron itself but you could still run custom logic such as started compilation for code or downloading certain binaries before the app starts.

Please note that overriding the start logic here only works in **development** if you want to change how an app runs once packaged you will need to use a build hook to inject code into the packaged app.

:::info
`StartOptions`is explained further [in the API docs](https://js.electronforge.io/interfaces/\_electron\_forge\_shared\_types.StartOptions.html).
:::

```javascript
export default class MyPlugin extends Pluginbase {
  async startLogic (opts) {
    await this.compileMainProcess();
    return null;
  }

  compileMainProcess () { /* ... */ }
}
```
