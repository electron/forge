---
description: >-
  Check your packaged app for insecure Electron settings and fuses.
---

# Security Audit Plugin

The Security Audit plugin checks your app against the [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security) every time you package it. It scans the scripts and HTML that ship in your app, after your bundler has run, and reads the [fuses](https://www.electronjs.org/docs/latest/tutorial/fuses) in the packaged Electron binary.

By default, packaging fails if the audit finds an error, and warnings are only printed.

## Installation

```shell
npm install --save-dev @electron-forge/plugin-security-audit
```

## Usage

Add the plugin to the [`plugins`](../configuration.mdx#plugins) array in your Forge configuration.

```javascript title="forge.config.js"
module.exports = {
  plugins: [
    {
      name: '@electron-forge/plugin-security-audit',
      config: {
        // Fail on warnings too
        failOn: 'warning',
        // Turn off or re-grade individual rules
        rules: {
          'sandbox-disabled': 'error',
          'fuse-file-protocol-privileges': 'off'
        },
        // Upload this file to GitHub code scanning
        sarifOutput: 'out/security-audit-{platform}-{arch}.sarif'
      }
    }
  ]
};
```

All configuration options are documented in [`SecurityAuditPluginConfig`](https://js.electronforge.io/interfaces/_electron_forge_plugin_security_audit.SecurityAuditPluginConfig.html).

## Rules

| Rule | Default | What it flags |
| --- | --- | --- |
| `node-integration` | error | `nodeIntegration: true` |
| `context-isolation-disabled` | error | `contextIsolation: false` |
| `web-security-disabled` | error | `webSecurity: false` |
| `insecure-content-allowed` | error | `allowRunningInsecureContent: true` |
| `insecure-command-line-switch` | error | `appendSwitch('disable-web-security')`, `ignore-certificate-errors` or `allow-running-insecure-content` |
| `node-integration-in-subframes` | warning | `nodeIntegrationInSubFrames: true` |
| `node-integration-in-worker` | warning | `nodeIntegrationInWorker: true` |
| `sandbox-disabled` | warning | `sandbox: false` |
| `experimental-features` | warning | `experimentalFeatures: true` |
| `blink-features` | warning | `enableBlinkFeatures` |
| `webview-tag` | warning | `webviewTag: true` |
| `remote-module` | warning | `@electron/remote` or `enableRemoteModule` |
| `insecure-url` | warning | `loadURL('http://…')` for hosts other than localhost |
| `missing-csp` | warning | HTML pages with no Content Security Policy, when no script sets a CSP header either |
| `unsafe-eval-csp` | warning | A CSP meta tag that allows `'unsafe-eval'` |
| `fuse-run-as-node` | warning | `RunAsNode` fuse enabled |
| `fuse-node-options` | warning | `EnableNodeOptionsEnvironmentVariable` fuse enabled |
| `fuse-node-cli-inspect` | warning | `EnableNodeCliInspectArguments` fuse enabled |
| `fuse-asar-integrity` | warning | `EnableEmbeddedAsarIntegrityValidation` fuse disabled (ASAR apps only) |
| `fuse-only-load-app-from-asar` | warning | `OnlyLoadAppFromAsar` fuse disabled (ASAR apps only) |
| `fuse-file-protocol-privileges` | warning | `GrantFileProtocolExtraPrivileges` fuse enabled |

Use the [Fuses plugin](fuses.mdx) to flip the fuses this plugin warns about.

## How it works

The plugin runs in the `packageAfterPrune` hook, so it sees exactly the files that ship, before they are packed into an ASAR archive. Files in `node_modules` are skipped. Use the `ignore` option to skip other paths, such as vendored code.

Source checks are pattern-based and understand minified output (for example `nodeIntegration:!0`). They can report settings that appear in comments or dead code; turn a rule off or add the file to `ignore` if that happens.

This plugin replaces the Electronegativity plugin, which was removed in Forge 8.
