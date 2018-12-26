#!/bin/bash -e

yarn global add now
bolt
bolt build
yarn docs:deploy:ci
