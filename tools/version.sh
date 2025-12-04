#!/bin/bash

set -e

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory is not clean. Please commit or stash your changes before running lerna:version."
  exit 1
fi

echo "Running lerna version..."
lerna version prerelease \
  --force-publish \
  --preid=alpha \
  --no-changelog \
  --exact \
  --no-git-tag-version \
  --no-push

# Releaser may decline to apply version changes. Exit early in that case.
if [ -z "$(git status --porcelain)" ]; then
  echo "No version changes were made. Exiting."
  exit 0
fi

BRANCH_NAME="alpha-release/$(date +'%y%m%d-%I-%M')"
echo "Creating branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

echo "Committing changes..."
git commit -a -m 'chore: version bump' -m '<trigger_release>'

echo "Version bump complete! Branch $BRANCH_NAME created and changes committed."
