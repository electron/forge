# Extending Electron Forge

Electron Forge is designed to be easily extendable by third parties with
whatever build logic you need.  The build flow for Electron Forge is split into
two main sections `make` and `publish` and you can define custom targets for
each of those commands.  For everything else we have a Plugin API which allows
you to hook into pretty much any part of forge's standard build process and do
whatever you want.

To briefly explain some terms:
  * `maker`: A tool that takes a packaged Electron application and outputs a
  certain kind of distributable.
  * `publisher`: A tool that takes distributables and "publishes" (normally
  just uploads) them somewhere.  Think GitHub releases.
  * `plugin`: A tool that hooks into forge's internals and can inject logic
  into your build process.

If there is something you want to be able to do with a plugin/maker/publisher
that isn't currently exposed, please don't hesitate to raise a Feature Request
issue on our [GitHub Repository](https://github.com/electron-userland/electron-forge).

## Writing Plugins

An Electron Forge Plugin has to export a single class that extends our base
plugin.  The base plugin can be depended on by installing
`@electron-forge/plugin-base`.  It can implement two methods, neither are
required:

{% method %}
### `getHook(hookName: string): Function`

If implemented this method will be called every time a hook fires inside Forge
and you must look at the `hookName` and either return a function to run for that
hook or return a falsey value to indicate you have no hook to run.

The possible `hookName` values and the parameters passed to the hook function
you return are documented over in the [Configuration](config) section of the
docs.

{% sample lang="javascript" %}
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
export default class MyPlugin extends PluginBase {
  getHook(hookName) {
    switch (hookName) {
      case 'prePackage':
        return this.prePackage;
        break;
    }
  }

  prePackage() {
    console.log('running prePackage hook);
  }
}
{%endace%}

{% endmethod %}

{% method %}
### `startLogic(startOpts: StartOptions): Promise<ChildProcess | null>`

If implemented this method will be called every time the user runs
`electron-forge start`, if you return a `ChildProcess` you can override the
built in start logic and Electron Forge will not spawn it's own process rather
watch the one you returned.  If you return `null` forge will spawn Electron
itself but you could still run custom logic such as started compilation for
code or downloading certain binaries before start.

NOTE: `StartOptions` is documented [on our API site](https://docs.electronforge.io/typedef/index.html#static-typedef-StartOptions)

{% sample lang="javascript" %}
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
export default class MyPlugin extends PluginBase {
  async startLogic(opts) {
    await this.compileMainProcess();
    return null;
  }

  compileMainProcess() { ... }
}
{%endace%}

{% endmethod %}

## Writing Makers

An Electron Forge Maker has to export a single class that extends our base
maker.  The base plugin can be depended on by installing
`@electron-forge/maker-base`.

The `MakerBase` class has some helper methods for your convenience.

| Method | Description |
|--------|-------------|
| `ensureDirectory(path: string)` | Ensures the directory exists and is forced to be empty.<br />I.e. If the directory already exists it is deleted and recreated, this is a desctructive operation |
| `ensureFile(path: string)` | Ensures the path to the file exists and the file does not exist<br />I.e. If the file already exists it is deleted and the path created |
| `isInstalled(moduleName: string)` | Checks if the given module is installed, used for testing if optional dependencies are installed or not |

Your maker must implement two methods:

{% method %}
### `isSupportedOnCurrentPlatform(): boolean`

This method must syncronously return a boolean indicating whether or not this
maker can run on the current platform.  Normally this is just a `process.platform`
check but it can be a deeper check for dependencies like fake-root or other
required external build tools.

If the issue is a missing dependency you should log out a **helpful** error message
telling the developer exactly what is missing and if possible how to get it.

{% sample lang="javascript" %}
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
export default class MyMaker extends MakerBase {
  isSupportedOnCurrentPlatform() {
    return process.platform === 'linux' && this.isFakeRootInstalled();
  }

  isFakeRootInstalled() { ... }
}
{%endace%}

{% endmethod %}

{% method %}
### `make(options): Promise<string[]>`

Makers must implement this method and return an array of **absolute** paths to
the artifacts this maker generated.  If an error occurs, simply reject the
promise and Electron Forge will stop the make process.

This `config` for the maker will be available on `this.config`.

The options object has the following structure.

| Key | Value |
|-----|-------|
| `dir` | The directory containing the packaged Electron application |
| `makeDir` | The directory you should put all your artifacts in (potentially in sub folders)<br />NOTE: this directory is not guarunteed to already exist |
| `appName` | The resolved human friendly name of the project |
| `targetPlatform` | The target platform you should make for |
| `targetArch` | The target architecture you should make for |
| `forgeConfig` | Fully resolved forge configuration, you shouldn't really need this |
| `packageJSON` | The applications package.json file |

{% sample lang="javascript" %}
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
export default class MyMaker extends MakerBase {
  async make(opts) {
    const pathToMagicInstaller = await makeMagicInstaller(opts.dir);
    return [pathToMagicInstaller];
  }
}
{%endace%}

{% endmethod %}

## Writing Publishers

An Electron Forge Publisher has to export a single class that extends our base
maker.  The base plugin can be depended on by installing
`@electron-forge/maker-base`.  Your maker must implement one method:

{% method %}
### `publish(options): Promise<void>`

Publishers must implement this method to publish the artifacts returned from
make calls.  If any errors occur you must throw them, failing silently or simply
logging will not propagate issues up to forge.

Please note for a given version publish will be called multiple times, once
for each set of "platform" and "arch".  This means if you are publishing
darwin and win32 artifacts to somewhere like GitHub on the first publish call
you will have to create the version on GitHub and the second call will just
be appending files to the existing version.

This `config` for the publisher will be available on `this.config`.

The options object has the following structure.

| Key | Value |
|-----|-------|
| `dir` | The base directory of the apps source code |
| `makeResults` | An array of MakeResult objects, see the [MakeResult](https://docs.electronforge.io/typedef/index.html#static-typedef-MakeResult) object definition for details |
| `packageJSON` | The packageJSON of the app |
| `forgeConfig` | The raw forgeConfig this app is using, you shouldn't really have to use this |
| `platform` | The platform these artifacts are for |
| `arch` | The arch these artifacts are for |

{% sample lang="javascript" %}
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
export default class MyPublisher extends PublisherBase {
  async publish(opts) {
    for (const artifact of opts.artifacts) {
      await createVersion(artifact.packageJSON.version);
      for (const artifactPath of artifact.artifacts) {
        await upload(artifact.packageJSON.version, artifactPath);
      }
    }
  }
}
{%endace%}

{% endmethod %}