#!/bin/bash

set -e

if [[ "$TRAVIS_OS_NAME" = "osx" ]]; then
    # Only publish coverage on the macOS yarn agent
    if [[ "$NODE_INSTALLER" = "yarn" ]]; then cat coverage/lcov.info | node node_modules/coveralls/bin/coveralls.js; fi
fi
