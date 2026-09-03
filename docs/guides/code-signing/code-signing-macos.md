---
description: >-
  Code signing is a security technology that you use to certify that an app was
  created by you.
---

# Signing a macOS app

On macOS, there are two layers of security technology for application distribution: **code signing** and **notarization**.

* **Code Signing** is the act of certifying the identity of the app's author and ensuring it was not tampered with before distribution.
* **Notarization** is an extra verification step where the app is sent to Apple servers for an automated malware scan.

:::info
From macOS 10.15 (Catalina) onwards, your application needs to be **both code signed and notarized** to run on a user's machine without disabling additional operating system security checks.

The exception is for Mac App Store (MAS) apps, where notarization is not required because the MAS submission process involves a similar automated check.
:::

## Prerequisites

### Installing Xcode

[Xcode](https://developer.apple.com/xcode/) is Apple's integrated development environment (IDE) for development on macOS, iOS, and other platforms.

Although Electron does not integrate tightly with the IDE itself, Xcode is a helpful tool for installing code signing certificates (see next section) and is **required** for notarization.

### Obtaining signing certificates

Code signing certificates for macOS apps can only be obtained through Apple by purchasing a membership to the [Apple Developer Program](https://developer.apple.com/programs/).

To sign Electron apps, you may require two separate certificates:

* The **Developer ID Installer** certificate is for apps distributed to the Mac App Store.
* The **Developer ID Application** certificate is for apps distributed outside the Mac App Store.

Once you have an Apple Developer Program membership, you first need to install them onto your machine. We recommend [loading them through Xcode](https://help.apple.com/xcode/mac/current/#/dev3a05256b8).

:::tip
**Verifying your certificate is installed**

Once you have installed your certificate, you can check available code signing certificates in your terminal using the following shell command:

```shell
security find-identity -p codesigning -v
```

:::

## Configuring Forge

In Electron Forge, macOS apps are signed and notarized at the **Package** step by the `electron-packager` library. There is a separate option within your Forge `packagerConfig` for each one of these settings.

### osxSign options

:::info
Under the hood, Electron Forge uses the [`@electron/osx-sign`](https://github.com/electron/osx-sign) tool to sign your macOS application.
:::

To enable code signing on macOS, ensure that `packagerConfig.osxSign` exists in your Forge configuration.

```javascript title="forge.config.js"
module.exports = {
  packagerConfig: {
    osxSign: {} // object must exist even if empty
  }
};
```

The `osxSign` config comes with defaults that work out of the box in most cases, so we recommend you start with an empty configuration object.

For a full list of configuration options, see the [`OsxSignOptions`](https://js.electronforge.io/modules/\_electron\_forge\_shared\_types.InternalOptions.html#OsxSignOptions) type in the Forge API docs. For more detailed information on how to configure these options, see the [`@electron/osx-sign` documentation](https://github.com/electron/osx-sign).

#### Customizing entitlements

A common use case for modifying the default `osxSign` configuration is to customize its entitlements. In macOS, **entitlements** are privileges that grant apps certain capabilities (e.g. access to the camera, microphone, or USB devices). These are stored within the code signature in an app's executable file.

By default, the `@electron/osx-sign` tool comes with a set of entitlements that should work on both MAS or direct distribution targets. See the complete set of default entitlement files [on GitHub](https://github.com/electron/osx-sign/tree/main/entitlements).

```javascript title="forge.config.js"
module.exports = {
  // ...
  packagerConfig: {
    // ...
    osxSign: {
      optionsForFile: (filePath) => {
        // Here, we keep it simple and return a single entitlements.plist file.
        // You can use this callback to map different sets of entitlements
        // to specific files in your packaged app.
        return {
          entitlements: 'path/to/entitlements.plist'
        };
      }
    }
  }
  // ...
};
```

For further reading on entitlements, see the following pages in Apple developer documentation:

* [Entitlements](https://developer.apple.com/documentation/bundleresources/entitlements)
* [Hardened Runtime](https://developer.apple.com/documentation/security/hardened\_runtime)

### osxNotarize options

:::info
Under the hood, Electron Forge uses the [`@electron/notarize`](https://github.com/electron/notarize) tool to notarize your macOS application.
:::

The `notarytool` command has three authentication options, which are detailed below. Note that you will want to use a `forge.config.js` configuration so that you can load environment variables into your Forge config.

:::danger
**Keep your authentication details private**

You should never store authentication info in plaintext in your configuration. In the examples below, credentials are stored as environment variables and accessed via the Node.js [`process.env`](https://nodejs.org/dist/latest-v16.x/docs/api/process.html#processenv) object.
:::

#### Option 1: Using an app-specific password

You can generate an [app-specific password](https://support.apple.com/en-us/HT204397) from Apple to provide your credentials to `notarytool`. This password will need to be regenerated if you change your Apple ID password.

There are two mandatory fields for `osxNotarize` if you are using this strategy:

| Field             | Type   | Description                                                                                                                                                                                                   |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appleId`         | string | Apple ID associated with your Apple Developer account                                                                                                                                                         |
| `appleIdPassword` | string | App-specific password                                                                                                                                                                                         |
| `teamId`          | string | The Apple Team ID you want to notarize under. You can find Team IDs for team you belong to by going to [`https://developer.apple.com/account/#/membership`](https://developer.apple.com/account/#/membership) |

```javascript title="forge.config.js"
module.exports = {
  // ...
  packagerConfig: {
    // ...
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    }
  }
  // ...
};
```

:::warning
Despite the name, `appleIdPassword` is **not** the password for your Apple ID account.
:::

#### Option 2: Using an App Store Connect API key

You can generate an App Store Connect API key to authenticate `notarytool` by going to the [App Store Connect access page](https://appstoreconnect.apple.com/access/integrations/api) and using the "Team Keys" tab. This API key will look something like `AuthKey_ABCD123456.p8` and can only be downloaded once.

There are three mandatory fields for `osxNotarize` if you are using this strategy:

| Field            | Type   | Description                                                                                                        |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| `appleApiKey`    | string | Filesystem path string to your API key file.                                                                       |
| `appleApiKeyId`  | string | 10-character alphanumeric ID string. In the previous `AuthKey_ABCD123456.p8` example, this would be `ABCD123456`.  |
| `appleApiIssuer` | string | UUID that identifies the API key issuer. You will find this ID in the "Keys" tab where you generated your API key. |

```javascript title="forge.config.js"
module.exports = {
  // ...
  packagerConfig: {
    // ...
    osxNotarize: {
      appleApiKey: process.env.APPLE_API_KEY,
      appleApiKeyId: process.env.APPLE_API_KEY_ID,
      appleApiIssuer: process.env.APPLE_API_ISSUER
    }
  }
  // ...
};
```

#### Option 3: Using a keychain

Instead of providing environment variables to the Forge config passed to `notarytool`, you can choose to use a macOS [keychain](https://support.apple.com/en-ca/guide/keychain-access/welcome/mac) containing either set of credentials (either Option 1 or Option 2 above).

You can do this directly in your terminal via the `notarytool store-credentials` command. For usage information, you can refer to the man page for `notarytool`:

```bash
man notarytool
```

There are two available fields for `osxNotarize` if you are using this strategy:

| Field                 | Type   | Description                                                                     |
| --------------------- | ------ | ------------------------------------------------------------------------------- |
| `keychainProfile`     | string | Name of the keychain profile containing your notarization credentials.          |
| `keychain` (optional) | string | Name of (or path to) the keychain containing the profile with your credentials. |

Note that if you use `notarytool store-credentials`, the `keychain` parameter can be auto-detected.

```javascript title="forge.config.js"
module.exports = {
  // ...
  packagerConfig: {
    // ...
    osxNotarize: {
      keychainProfile: 'my-keychain-profile'
    }
  }
  // ...
};
```

### Example configuration

Below is a minimal Forge configuration for `osxSign` and `osxNotarize`.

```javascript title="forge.config.js"
module.exports = {
  packagerConfig: {
    osxSign: {},
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    }
  }
};
```
