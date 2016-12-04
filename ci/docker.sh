#!/bin/bash

NODE_INSTALLER="$1"

if [[ "$NODE_INSTALLER" = "yarn" ]]; then npm i -g yarn; fi
npm run test -- --installer=$NODE_INSTALLER
