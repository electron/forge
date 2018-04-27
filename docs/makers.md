# Makers

Makers are Electron Forge's way of taking your packaged application and making
platform specific distributables like DMG, Exe or flatpak files (amongst others).

Each maker has to be configured in the `makers` section of your forge configuration
with which platforms to run for and the maker specific config.  E.g.

```js
// forge.config.js
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux'],
      config: {
        // Config here
      }
    }
  ]
}
```

Please note that all makers have logical defaults for the `platforms` value so you
normally don't need to specify that.

Each built in maker, their config options and their output are documented below,
there are also a number of [community provided make targets](https://www.npmjs.com/search?q=electron-forge-maker).

{% method %}
## AppX

The AppX target builds `.appx` packages which are designed to target the windows
store.  You can only build the AppX target on Windows machines with the Windows
10 SDK installed.  Check the [`electron-windows-store`](https://github.com/felixrieseberg/electron-windows-store#usage)
docs for more information on platform requirements.

Configuration options are documented in [`MakerAppXConfig`](ref:///ts/maker/appx/interfaces/makerappxconfig.html)

{% sample lang="javascript" %}
###### Usage
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
{
  name: '@electron-forge/maker-appx',
  config: {
    publisher: 'CN=developmentca',
    devCert: 'C:\\devcert.pfx',
    certPass: 'abcd'
  }
}
{%endace%}

{% endmethod %}

{% method %}
## Deb

The Deb target builds `.deb` packages which are the standard package format
for debian based linux distributions such as Ubuntu.  You can only build the Deb
target on Linux machines with the `fakeroot` and `dpkg` packages installed.

Configuration options are documented in [`MakerDebConfig`](ref:///ts/maker/deb/interfaces/makerdebconfig.html)

{% sample lang="javascript" %}
###### Usage
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
{
  name: '@electron-forge/maker-deb',
  config: {
    options: {
      maintainer: 'Joe Bloggs',
      homepage: 'http://example.com'
    }
  }
}
{%endace%}

{% endmethod %}

{% method %}
## DMG

The DMG target builds `.dmg` files which are the standard format for sharing
macOS apps, the DMG acts like a zip file but provides an easy way for your users
to take the app and put it in the `/Applications` directory.  You can only build
the DMG target on macOS machines.

Configuration options are documented in [`MakerDMGConfig`](ref:///ts/maker/dmg/interfaces/makerdmgconfig.html)

{% sample lang="javascript" %}
###### Usage
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
{
  name: '@electron-forge/maker-dmg',
  config: {
    background: './assets/dmg-background.png',
    format: 'ULFO'
  }
}
{%endace%}

{% endmethod %}

{% method %}
## Flatpak

The Flatpak target builds `.flatpak` files which is a packaging format for linux
OS's that allows for sandboxed installation of applications in isolation from
the rest of their system.  Unlike typical Deb or Rpm installation methods which
are not sandboxed.  You can only build the Flatpak target if you have `flatpak`
and `flatpak-builder` installed on your system.

Configuration options are documented in [`MakerFlatpakConfig`](ref:///ts/maker/flatpak/interfaces/makerflatpakconfig.html)

{% sample lang="javascript" %}
###### Usage
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
{
  name: '@electron-forge/maker-flatpak',
  config: {
    options: {
      categories: ['Video'],
      mimeType: ['video/h264']
    }
  }
}
{%endace%}

{% endmethod %}

{% method %}
## RPM

The RPM target builds `.rpm` files which is the standard package format for
redhat based linux distributions such as Fedora.  You can only build the RPM
target on Linux machines with the `fakeroot` and `rpm` packages installed.

Configuration options are documented in [`MakerRpmConfig`](ref:///ts/maker/rpm/interfaces/makerrpmconfig.html)

{% sample lang="javascript" %}
###### Usage
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
{
  name: '@electron-forge/maker-rpm',
  config: {
    options: {
      maintainer: 'Joe Bloggs',
      homepage: 'http://example.com'
    }
  }
}
{%endace%}

{% endmethod %}

{% method %}
## Snapcraft

The Snapcraft target builds `.snap` files which is the packaging format created
and sponsored by Canconical (the creators of Ubuntu).  It is a sandboxed package
format that let's users install your application in an isolated environment on
their machine.  You can only build the Snapcraft target on linux systems with
the [`snapcraft`](https://snapcraft.io/) package installed.

Configuration options are documented in [`MakerSnapConfig`](ref:///ts/maker/snap/interfaces/makersnapconfig.html)

{% sample lang="javascript" %}
###### Usage
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
{
  name: '@electron-forge/maker-snap',
  config: {
    features: {
      audio: true,
      mpris: 'com.example.mpris',
      webgl: true
    },
    summary: 'Pretty awesome'
  }
}
{%endace%}

{% endmethod %}

{% method %}
## Squirrel.Windows

The Squirrel.Windows target builds a number of files required to distribute apps
using the Squirrel.Windows framework.  It generates a `{appName} Setup.exe` file
which is the main installer for your application and `{appName}-full.nupkg` and
a `RELEASES` file which you use to issue updates to your application.

Squirrel.Windows is a no-prompt, no-hassle, no-admin method of installing
Windows applications and is therefore the most user friendly you can get.  You
can only build the Squirrel.Windows target on a Windows machine or on a macOS / 
Linux machine with `mono` and `wine` installed.

Configuration options are documented in [`MakerSquirrelConfig`](ref:///ts/maker/squirrel/interfaces/makersquirrelconfig.html)

{% sample lang="javascript" %}
###### Usage
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
{
  name: '@electron-forge/maker-squirrel',
  config: {
    certificateFile: './cert.pfx',
    certificatePassword: 'this-is-a-secret'
  }
}
{%endace%}

{% endmethod %}

{% method %}
## Wix MSI

The Wix MSI target builds `.msi` files which are "traditional" windows installer
files.  Please note we reccomend using the [Squirrel.Windows](#Squirrel.Windows)
target over using this one. These MSI files are a worse user experience for
installation but sometimes it is necessary to build MSI files to appease large
scale enterprise companies with internal application distribution policies.  For
more info, check out [Should I use Wix MSI?](https://github.com/felixrieseberg/electron-wix-msi#should-i-use-this).

You can only build the Wix MSI target on machines with `light` and `candle` installed
from the Wix toolkit.

Configuration options are documented in [`MakerWixConfig`](ref:///ts/maker/wix/interfaces/makerwixconfig.html)

{% sample lang="javascript" %}
###### Usage
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
{
  name: '@electron-forge/maker-wix',
  config: {
    language: 1033,
    manufacturer: 'My Awesome Company'
  }
}
{%endace%}

{% endmethod %}

{% method %}
## Zip

The Zip target builds basic `.zip` files containing your packaged application.
There are no platform specific dependencies for using this maker and it will run
on any platform.

There are no configuration options for this target.

{% sample lang="javascript" %}
###### Usage
{%ace edit=false, lang='javascript', check=false, theme="tomorrow_night" %}
{
  name: '@electron-forge/maker-snap'
}
{%endace%}

{% endmethod %}