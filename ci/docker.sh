#!/bin/bash

set -e

NODE_INSTALLER="$1"

npm i -g yarn
npm i -g bolt@0.21.2

cd /code

bolt
bolt build
bolt lint

DEBUG=electron-installer-snap:snapcraft CI=true bolt test -- --installer=$NODE_INSTALLER
