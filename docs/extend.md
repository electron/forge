# Extending Electron Forge

Electron Forge is designed to be easily extendable by third parties with
whatever build logic you need.  The build flow for Electron Forge is split into
two main sections `make` and `publish` and you can define custom targets for
each of those commands.  For everything else we have a Plugin API which allows
you to hook into pretty much any part of forge's standard build process and do
whatever you want.

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

## Writing Publishers