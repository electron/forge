#!/bin/bash

if [[ "$TRAVIS_OS_NAME" = "linux" ]]; then
    sudo docker run --privileged --interactive --tty --volume $(pwd):/code malept/electron-forge-container:latest /code/ci/docker.sh $NODE_INSTALLER
else
    bolt
    bolt build
    bolt lint
    bolt ws test
fi
