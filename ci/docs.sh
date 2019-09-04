#!/bin/bash -e

# Pinned due to https://github.com/zeit/now/issues/2941
yarn global add now@16.1.2
bolt
bolt build
yarn docs:deploy:ci
