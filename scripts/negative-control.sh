#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
mkdir -p "$scratch/src" "$scratch/test"
cp src/nosave.js "$scratch/src/"
cp -R test/nosave.test.js test/fixtures "$scratch/test/"
perl -0pi -e 's/return label\.length > text\.length \+ 1 && label\.startsWith\(text \+ " "\);/return true;/' "$scratch/src/nosave.js"
if cmp -s src/nosave.js "$scratch/src/nosave.js"; then
  echo "negative control did not mutate the label check"
  exit 1
fi
set +e
NODE_PATH="$(pwd)/node_modules" node --test --test-reporter=spec "$scratch/test/nosave.test.js" >"$scratch/output.log" 2>&1
status=$?
set -e
if [ "$status" -eq 0 ]; then
  echo "negative control unexpectedly passed"
  exit 1
fi
grep -q '✖ leaves the Save button in the opened preview panel alone' "$scratch/output.log"
echo "✓ negative control caught a broken label check"
