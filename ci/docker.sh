#!/bin/bash

NODE_INSTALLER="$1"

npm i -g yarn
npm i -g bolt

cd /code

CI=true bolt ws test -- --installer=$NODE_INSTALLER
