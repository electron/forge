#!/bin/sh

if test "$(uname -s)" = "Darwin"; then
    export KEY_CHAIN=mac-build.keychain
    KEYCHAIN_PASSWORD=unsafe_keychain_pass
    security create-keychain -p $KEYCHAIN_PASSWORD $KEY_CHAIN
    # Make the keychain the default so identities are found
    security default-keychain -s $KEY_CHAIN
    # Unlock the keychain
    security unlock-keychain -p $KEYCHAIN_PASSWORD $KEY_CHAIN
    # Set keychain locking timeout to 3600 seconds
    security set-keychain-settings -t 3600 -u $KEY_CHAIN

    echo "Add keychain to keychain-list"
    security list-keychains -s mac-build.keychain

    echo Generating Identity
    "$(dirname $0)"/generate-identity.sh

    echo "Setting key partition list"
    security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k $KEYCHAIN_PASSWORD $KEY_CHAIN

    # Echo the identity
    security find-identity -v -p codesigning
fi