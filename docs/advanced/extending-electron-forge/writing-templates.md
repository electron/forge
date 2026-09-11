---
description: How to write custom templates for Electron Forge.
---

# Writing Templates

Templates in Electron Forge implement the `ForgeTemplate` interface, namely:

* `requiredForgeVersion` _(required)_ - the semantic version range of Electron Forge versions that this template supports. For example, `^6.0.0-beta.1`
* `dependencies` _(optional)_ - a list of package identifiers that you pass to a package manager (which may include a version range) to add to the `dependencies` field in `package.json`. For example, `jquery` or `jquery@^3.0.0`
* `devDependencies` _(optional)_ - a list of package identifiers that you pass to a package manager (which may include a version range) to add to the `devDependencies` field in `package.json`. For example, `eslint` or `eslint@^7.0.0`
* `initializeTemplate` _(optional)_ - an `async` function that allows the template to perform custom actions, for example copying files from a `tmpl` folder into the new app. The exact function signature is defined in the shared types package.

To use the custom template, run the [init](../../cli.md#init) command and point the template at the file that contains the `ForgeTemplate` implementation.
