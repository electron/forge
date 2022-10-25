## maker-flatpak

`@electron-forge/maker-flatpak` [`.flatpak` files](http://flatpak.org/), which is a packaging format for Linux distributions that allows for sandboxed installation of applications in isolation from the rest of their system.

You can only build the Flatpak target if you have `flatpak`, `flatpak-builder`, and `eu-strip` _\(usually part of the `elfutils` package\)_ installed on your system.

Configuration options are documented in [`MakerFlatpakOptionsConfig`](https://js.electronforge.io/interfaces/_electron_forge_maker_flatpak._internal_.MakerFlatpakOptionsConfig.html).

```javascript
{
  name: '@electron-forge/maker-flatpak',
  config: {
    options: {
      categories: ['Video'],
      mimeType: ['video/h264']
    }
  }
}
```
