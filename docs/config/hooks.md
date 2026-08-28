---
description: Specify custom build logic with asynchronous callback functions
---

# Hooks

In Electron Forge, hooks are asynchronous callback functions that allow you to insert your own logic at different points in the development or build process.

Each hook function comes with the Forge configuration object as a first parameter.

:::warning
Any writes to `stdout` and `stderr` from within a hook function will be printed in the console after the Forge build completes, and will only be visible with the `DEBUG` or `CI` environment variables set to some truthy value.
:::

:::info
To read more about the different stages in Forge's build process, please refer to the [Build Lifecycle](../core-concepts/build-lifecycle.md) documentation.
:::

## Simple hooks

In Electron Forge, most hooks are **simple hooks**, which perform side effects during the build lifecycle without directly affecting subsequent steps in the build.

### **`generateAssets`**

* **Arguments:**
  * **`config:`**[**`ResolvedForgeConfig`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ResolvedForgeConfig.html) - Forge configuration object
  * **`platform: string`** - Operating system platform
  * **`arch: string`** - CPU architecture
* **Returns: `Promise<void>`**

`generateAssets()` is invoked before Forge's **`start`** or **`package`** commands.

You can use this hook to generate any static files or resources your app requires on runtime but aren't in the source code.

For instance, you could use this hook to generate a license file containing the license of all your dependencies.

### `preStart`

* **Arguments:**
  * **`config:`**[**`ResolvedForgeConfig`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ResolvedForgeConfig.html) - Forge configuration object
* **Returns: `Promise<void>`**

`preStart()` is invoked before Forge's **`start`** command launches the app in dev mode.

You can use this hook to run prepatory logic before your app launches.

```javascript title="forge.config.js"
module.exports = {
  hooks: {
    preStart: async (forgeConfig) => {
      console.log(`Starting up app on platform: ${process.platform}`);
    }
  }
};
```

### `postStart`

* **Arguments:**
  * **`config:`**[**`ResolvedForgeConfig`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ResolvedForgeConfig.html) - Forge configuration object
  * **`appProcess:`**[**`ChildProcess`**](https://nodejs.org/api/child_process.html#class-childprocess) **-** Node.js child process instance
* **Returns: `Promise<void>`**

`postStart()` is called after Forge's **`start`** command launches the app in dev mode.

You can use this hook to attach listeners to the spawned child process.

```javascript title="forge.config.js"
module.exports = {
  hooks: {
    postStart: async (forgeConfig, appProcess) => {
      console.log(`Spawned child pid: ${appProcess.pid}`);
    }
  }
};
```

### `prePackage`

* **Arguments:**
  * **`config:`**[**`ResolvedForgeConfig`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ResolvedForgeConfig.html) - Forge configuration object
  * **`platform: string`** - Operating system platform
  * **`arch: string`** - CPU architecture
* **Returns: `Promise<void>`**

`prePackage()` is called before Forge runs Electron Packager in the **`package`** step .

### `packageAfterCopy`

* **Arguments:**
  * **`config:`**[**`ResolvedForgeConfig`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ResolvedForgeConfig.html) - Forge configuration object
  * **`buildPath: string`**- the app's temporary folder path
  * **`electronVersion: string`**- the app's Electron version
  * **`platform: string`** - Operating system platform
  * **`arch: string`** - CPU architecture
* **Returns: `Promise<void>`**

`packageAfterCopy()` is called inside the [`afterCopy`](https://electron.github.io/packager/main/interfaces/Options.html#afterCopy) hook of Electron Packager.

During Forge's **`package`** step, Electron Packager copies your app's build directory to a temporary folder.

The `afterCopy` hook runs after this copy step.

### `packageAfterPrune`

* **Arguments:**
  * **`config:`**[**`ResolvedForgeConfig`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ResolvedForgeConfig.html)- Forge configuration object
  * **`buildPath: string`**- the app's temporary folder path
  * **`electronVersion: string`**- the app's Electron version
  * **`platform: string`** - Operating system platform
  * **`arch: string`** - CPU architecture
* **Returns: `Promise<void>`**

`packageAfterPrune()` is called inside the [`afterPrune`](https://electron.github.io/packager/main/interfaces/Options.html#afterPrune) hook of Electron Packager.

During Forge's **`package`** step, Electron Packager prunes non-production `node_modules` dependencies from the temporary folder your app is copied to. This step minimizes the size of your app's production bundle.

The `afterPrune` hook runs after this prune step.

:::info
`packageAfterPrune()` will have no effect if your `packagerOptions.prune` option is set to `false`.
:::

### `packageAfterExtract`

* **Arguments:**
  * **`config:`**[**`ResolvedForgeConfig`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ResolvedForgeConfig.html)- Forge configuration object
  * **`buildPath: string`**- the Electron binary's temporary folder path
  * **`electronVersion: string`**- the app's Electron version
  * **`platform: string`** - Operating system platform
  * **`arch: string`** - CPU architecture
* **Returns: `Promise<void>`**

`packageAfterExtract()` is called inside the [`afterExtract`](https://electron.github.io/packager/main/interfaces/Options.html#afterExtract) hook of Electron Packager.

During Forge's **`package`** step, Electron Packager extracts your Electron binary into a temporary folder.

The `afterExtract` hook runs after this extract step.

### `postPackage`

* **Arguments:**
  * **`config:`**[**`ResolvedForgeConfig`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ResolvedForgeConfig.html)- Forge configuration object
  * **`packageResult: Object`**
    * **`platform: string`** - Operating system platform
    * **`arch: string`** - CPU architecture
    * **`outputPaths: string[]`** - filesystem paths for package output
* **Returns: `Promise<void>`**

\
`postPackage()` is called after Forge's **`package`** step has successfully completed.

For example:

```javascript title="forge.config.js"
module.exports = {
  hooks: {
    postPackage: async (forgeConfig, options) => {
      console.info('Packages built at:', options.outputPaths);
    }
  }
};
```

### `preMake`

* **Arguments:**
  * **`config:`**[**`ResolvedForgeConfig`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ResolvedForgeConfig.html)- Forge configuration object
* **Returns: `Promise<void>`**

`preMake()` is called before the **`make`** step runs.

## Mutating hooks

In Electron Forge, **mutating hooks** are a special kind of hook that return the same type of value as their second parameter.

The returned value will replace the original parameter's value for subsequent steps in the Forge lifecycle.

### `postMake`

* **Arguments:**
  * **`config:`**[**`ResolvedForgeConfig`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ResolvedForgeConfig.html)- Forge configuration object
  * **`makeResults:`**[**`MakeResult`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ForgeMakeResult.html)**`[]`**
* **Returns: `Promise<`**[**`MakeResult`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ForgeMakeResult.html)**`[] | void>`**

`postMake()`is called after Forge's **`make`** step has successfully completed.

It is passed an array of [`MakeResult`](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ForgeMakeResult.html) objects that are output from the `make` step. If you wish to mutate the array of Make results, you can return a new array of [`MakeResult`](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ForgeMakeResult.html) objects that Electron Forge can use for future steps.

### `readPackageJson`

* **Arguments:**
  * **`config:`**[**`ResolvedForgeConfig`**](https://js.electronforge.io/interfaces/_electron_forge_shared_types.ResolvedForgeConfig.html)- Forge configuration object
  * **`packageJson: Record<string, unknown>`** - Full package.json object
* **Returns: `Promise<Record<string, unknown> | void>`**

`readPackageJson()` is called every time Forge attempts to read your `package.json` file.

The full package.json object is passed in as a parameter. If you want to modify that object in any way, you must do so and return the new value for Forge to use.

This is useful to set things like the package.json `version` field at runtime.

```javascript title="forge.config.js"
module.exports = {
  hooks: {
    readPackageJson: async (forgeConfig, packageJson) => {
      packageJson.version = '4.0.0';
      return packageJson;
    }
  }
};
```

:::warning
**Note:** this hook will not change the name or version used by Electron Packager to customize your app metadata, as that is read prior to this hook being called (during Electron Packager's `afterCopy` hooks).
:::
