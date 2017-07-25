#!/bin/bash

if [[ "$TRAVIS_OS_NAME" = "linux" ]]; then
    sudo docker build -f ci/Dockerfile . -t electron-forge-ci
    sudo docker run -it electron-forge-ci ci/docker.sh $NODE_INSTALLER
else
    npm run test-coverage -- --installer=$NODE_INSTALLER
fi
