#!/bin/bash

set -e

if [[ "$TRAVIS_OS_NAME" = "linux" ]]; then
    sudo docker run --privileged --interactive --tty --volume $(pwd):/code malept/electron-forge-container:latest /code/ci/docker.sh $NODE_INSTALLER
else
    bolt
    yarn build
    yarn lint
    yarn test
    echo "$NODE_INSTALLER-$TRAVIS_SECURE_ENV_VARS-$TRAVIS_BRANCH"
    if [[ "$NODE_INSTALLER-$TRAVIS_SECURE_ENV_VARS-$TRAVIS_BRANCH" = "yarn-true-master" ]]; then
        npm i -g now
        yarn docs:deploy:ci
    fi
fi
