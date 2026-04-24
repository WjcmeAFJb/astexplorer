#!/bin/sh

set -e

rm -rf out/*
(
  cd packages/website/
  yarn
  if [ "$1" = "--dev" ]; then
    yarn build-dev
  else
    yarn build
  fi
)
