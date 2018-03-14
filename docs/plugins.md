# Plugins

Electron Forge has a plugin system which allows easy extensibility of the core
functionality of forge.  By default forge takes a vanilla JS application and
packages, makes and publishes it.  Through the use of plugins, some of which are
listed below, you can make forge even more powerful.  For instance integrating
directly with industry standard build tooling like webpack.

{% method %}
## Webpack

The webpack plugin allows you to use standard webpack tooling to compile both
your main process code and your renderer process code with built in support for
Hot Module Reloading in the renderer process and support for multiple renderers.

{% sample lang="bash" %}
###### Installation
{%ace edit=false, lang='bash', check=false, theme="tomorrow_night" %}
yarn add @electron-forge/plugin-webpack --dev
{%endace%}

###### Basic Usage
{%ace edit=false, lang='json', check=false, theme="tomorrow_night" %}
{
  "plugins": [
    ["@electron-forge/plugin-webpack", {
      "mainConfig": "./webpack.main.config.js",
      "renderer": {
        "config": "./webpack.renderer.config.js",
        "entryPoints": [{
          "html": "./src/renderer/index.html",
          "js": "./src/renderer/index.js",
          "name": "main"
        }]
      }
    }]
  ]
}
{%endace%}

{% endmethod %}

## Electron Compile

### Installation

### Usage

## Parcel

### Installation

### Usage