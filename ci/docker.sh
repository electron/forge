#!/bin/bash

set -e

NODE_INSTALLER="$1"

npm i -g yarn
npm i -g bolt@0.22.5

cd /code

bolt
bolt build
bolt lint

# For flatpak
mkdir -p /var/run/dbus
dbus-daemon --system

DEBUG=electron-installer-snap:snapcraft CI=true bolt coverage -- --installer=$NODE_INSTALLER
