#!/bin/bash -e

NODE_INSTALLER="$1"

npm install -g bolt

# For flatpak
mkdir -p /var/run/dbus
dbus-daemon --system
/sbin/modprobe fuse

DEBUG=electron-installer-snap:snapcraft,electron-installer-flatpak,@malept/flatpak-bundler CI=true bolt coverage -- --installer=$NODE_INSTALLER
