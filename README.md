Electron Forge
--------------
[![Build Status](https://travis-ci.org/MarshallOfSound/electron-forge.svg?branch=master)](https://travis-ci.org/MarshallOfSound/electron-forge)

> The simple way to get started with Electron

# Let's do it!

```bash
npm install -g electron-forge
electron-forge init my-new-app
cd my-new-app
electron-forge start
```

# Urgh, really...  Another build tool

Funnily enough, no :D.  This is not another build tool, `electron-forge` simply
unifies the existing (and well maintained) build tools for Electron development
into one, simple, easy to use package so that anyone can just jump right in
to Electron development.

# So what's the point

This project has a few main goals.

1. Starting with Electron should be as simple as a single command
2. Developers shouldn't have to worry about `babel`, `browserify`, `webpack` or
any of that nonsense.  Everything should just work for them out of the box.
3. Everything from creating the project to packaging the project for release
should be handled by one dependency in a standard way while still offering users
maximum choice and freedom.

With these goals in mind, under the hood this project uses
[`electron-compile`](https://github.com/electron/electron-compile).  A tool
that lets you use modern and futuristic langauges inside Electron without
worrying about transpiling or build tooling.

# So go on then... How do I use the thing :)

Glad you asked, it's beyond easy to get started with `electron-forge`.

```bash
npm install -g electron-forge
electron-forge init my-new-project
```

This command will generate you a brand new project folder and install all your
NPM dependencies so you will be all set to go.

When you want to start your app it's as simple as

```bash
electron-forge start
```

Any args after "start" will be passed through to your application when it is launched.

And when you get round to packaging your application, all you have to do is:

```bash
electron-forge package
```

# But I want to set [insert property here] to `electron-packager`

Good news, the `package` command also passes through any arguments you give it
directly to `electron-packager`.  So if you want the all the power, you have it.

# CLI Usage

```bash
electron-forge --help
```

Running `--help` will give you a lot of the syntax that `electron-forge` expects.

Basically there are 4 top level commands to provide `electron-forge`.
* `init` - Similar to `git init` and `npm init`.  It creates a new project from
scratch and sets everything up for you
* `lint` - Run basic JS style linting across your application.  Good for sanity
checking your code.
* `package` - Packages your application into a platform specific format.  Windows
will get `.exe`, macOS will get `.app` and so on.
* `start` - Immediately launches your application
