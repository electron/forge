#!/bin/bash -e

NODE_INSTALLER="$1"
BOLT_VERSION="$2"

npm i -g yarn
npm i -g bolt@$BOLT_VERSION

cd /code

bolt
bolt build
bolt lint

# For flatpak
mkdir -p /var/run/dbus
dbus-daemon --system

DEBUG=electron-installer-snap:snapcraft CI=true bolt test -- --installer=$NODE_INSTALLER
