#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
mkdir -p "$scratch/src" "$scratch/test"
cp src/nosave.js "$scratch/src/"
cp -R test/nosave.test.js test/fixtures "$scratch/test/"
perl -0pi -e 's/if \(name\.length <= text\.length \+ 1 \|\| !name\.startsWith\(text \+ " "\)\) return null;//' "$scratch/src/nosave.js"
if cmp -s src/nosave.js "$scratch/src/nosave.js"; then
  echo "negative control did not mutate the label check"
  exit 1
fi
set +e
NODE_PATH="$(pwd)/node_modules" node --test --test-reporter=spec "$scratch/test/nosave.test.js" >"$scratch/output.log" 2>&1
status=$?
set -e
if [ "$status" -eq 0 ] || ! grep -q '✖ does not match look-alikes' "$scratch/output.log"; then
  echo "negative control: the broken label check was not caught"
  cat "$scratch/output.log"
  exit 1
fi
echo "✓ negative control caught a broken label check"
