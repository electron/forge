#!/bin/bash

NODE_INSTALLER="$1"

npm i -g yarn

cd /code

CI=true bolt ws test -- --installer=$NODE_INSTALLER
