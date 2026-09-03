# Debugging

In Electron apps, the main and renderer processes have different debugging mechanisms:

* Renderer processes can be debugged using Chromium DevTools.
* The main process can be debugged via the `--inspect` and `--inspect-brk` command line flags.

This guide goes over Forge-specific ways of debugging the main process through the command line or with a code editor.

:::info
Each section in this guide assumes your `package.json` has a `"start": "electron-forge start"` script.
:::

For more general information on debugging Electron apps, see the [main Electron docs on Application Debugging](https://www.electronjs.org/docs/latest/tutorial/application-debugging#renderer-process).

## Debugging on the command line

You can specify the `--inspect-electron` flag when running `electron-forge start`. Internally, this will activate the [Electron `--inspect`flag](http://electronjs.org/docs/tutorial/debugging-main-process#--inspectport), and the main process will listen for a debugging client on port 5858.

```bash
npm run start -- --inspect-electron
```

Once your app is active, open [`chrome://inspect`](chrome://inspect) in any Chromium-based browser to attach a debugger to the main process of your app.

:::info
To add a breakpoint at the first line of execution when debugging, you can use Forge's `--inspect-brk-electron` flag instead.
:::

## Debugging with VS Code

To debug the main process through VS Code, add the following [Node.js launch configuration](https://code.visualstudio.com/docs/nodejs/nodejs-debugging):

```json5 title=".vscode/launch.json"
{
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Electron Main",
      "runtimeExecutable": "${workspaceFolder}/node_modules/@electron-forge/cli/script/vscode.sh",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/@electron-forge/cli/script/vscode.cmd"
      },
      // runtimeArgs will be passed directly to your Electron application
      "runtimeArgs": [
        "foo",
        "bar"
      ],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

Once this configuration is added, launch the app via VS Code's Run and Debug view to start debugging.

## Debugging with WebStorm or Other Jetbrains IDEs

1. Access the `Run > Debug...` menu and select the `Edit Configurations...` option to open the `Run/Debug Configurations` window.
2. Click on the `Add new configuration` button (the `+` icon) in the upper-left corner and select the `npm` template.
3. In the `Scripts` dropdown menu, select `start`.
4. Click on `Debug` to start debugging your app.
