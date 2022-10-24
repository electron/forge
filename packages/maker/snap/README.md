## Electron Forge: Maker Snap

`@electron-forge/maker-snap` builds `.snap` files, which is the packaging format created and sponsored by Canonical, the company behind Ubuntu. It is a sandboxed package format that lets users of various Linux distributions install your application in an isolated environment on their machine.

You can only build the Snapcraft target on Linux systems with the `snapcraft` package installed.

```
{
  name: '@electron-forge/maker-snap',
  config: {
    version: "1.1.0",
    features: {
      audio: true,
      mpris: 'com.example.mpris',
      webgl: true
    },
    summary: 'My application'
  }
}
```