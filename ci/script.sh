#!/bin/bash

if [[ "$TRAVIS_OS_NAME" = "linux" ]]; then
    sudo docker run --interactive --tty --volume $(pwd):/code malept/electron-forge-container:latest /code/ci/docker.sh $NODE_INSTALLER
else
    npm run test-coverage -- --installer=$NODE_INSTALLER
fi
