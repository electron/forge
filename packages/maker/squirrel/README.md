## maker-squirrel

`@electron-forge/maker-squirrel` builds a number of files required to distribute apps using the Squirrel.Windows framework. It generates a `{appName} Setup.exe` file which is the main installer for your application, `{appName}-full.nupkg` and a `RELEASES` file which you use to issue updates to your application.

Pre-requisites:

* Windows machine
* Linux machine with `mono` and `wine` installed.

Configuration options are documented in [`MakerSquirrelConfigOptions`](https://js.electronforge.io/interfaces/_electron_forge_maker_squirrel.InternalOptions.Options.html).

```javascript
{
  name: '@electron-forge/maker-squirrel',
  config: {
    certificateFile: './cert.pfx',
    certificatePassword: 'this-is-a-secret'
  }
}
```
