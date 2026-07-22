#!/usr/bin/env bash
set -euo pipefail

rm -rf site
mkdir -p site/playground

pnpm docs:build
pnpm build:playground

cp -R docs/.vitepress/dist/. site/
cp -R playground/dist/. site/playground/
