# Writing Makers

An Electron Forge Maker has to export a single class that extends our base maker. The base maker can be depended on by installing`@electron-forge/maker-base`.

The `MakerBase` class has some helper methods for your convenience. Check out the interface of [`MakerBase`](https://js.electronforge.io/classes/_electron_forge_maker_base.MakerBase.html) for more advanced API details.

| Method | Description |
| :--- | :--- |
| `ensureDirectory(path)` | Ensures the directory exists and is forced to be empty.  This is a destructive operation. |
| `ensureFile(path)` | Ensures the path to the file exists and the file does not exist, if the file exists it is deleted and the path created. |
| `isInstalled(moduleName)` | Checks if the given module is installed, used for testing if optional dependencies are installed or not. |

Your maker **must** implement two methods:

### `isSupportedOnCurrentPlatform(): boolean`

This method must synchronously return a boolean indicating whether or not this maker can run on the current platform. Normally this is just a `process.platform` check but it can be a deeper check for dependencies like `fake-root` or other required external build tools.

If the issue is a missing dependency you should log out a **helpful** error message telling the developer exactly what is missing and if possible how to get it.

```javascript
export default class MyMaker extends MakerBase {
  isSupportedOnCurrentPlatform () {
    return process.platform === 'linux' && this.isFakeRootInstalled();
  }

  isFakeRootInstalled () { /* ... */ }
}
```

### `make(options: MakerOptions): Promise<string[]>`

Makers must implement this method and return an array of **absolute** paths to the artifacts this maker generated. If an error occurs, reject the promise and Electron Forge will stop the `make` process.

The `config` for the maker will be available on `this.config`.

The options object is documented in [`MakerOptions`](https://js.electronforge.io/interfaces/_electron_forge_maker_base.MakerOptions.html).

```javascript
export default class MyMaker extends MakerBase {
  async make (opts) {
    const pathToMagicInstaller = await makeMagicInstaller(opts.dir);
    return [pathToMagicInstaller];
  }
}
```
