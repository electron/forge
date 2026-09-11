---
description: Configure Code Signing with Electron Forge
---

# Code Signing

Code signing is a security technology that you use to certify that an app was created by you. If you are building an Electron app that you intend to package and distribute, it should be code signed so it does not trigger any operating system security checks. This step is _highly recommended_ if you want to distribute your app publicly as code signing is an important security concept on both macOS and Windows.

This guide is split into two separate pages because there is a separate process for each platform:

- [Signing a macOS app](code-signing-macos.md)
- [Signing a Windows app](code-signing-windows.mdx)
