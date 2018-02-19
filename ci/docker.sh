#!/bin/bash

NODE_INSTALLER="$1"

npm i -g yarn
npm i -g bolt

cd /code

rm -rf node_modules
bolt
bolt build

CI=true bolt ws test -- --installer=$NODE_INSTALLER
