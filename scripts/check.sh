#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm test
for file in src/*.js test/*.js; do node --check "$file"; done
./scripts/negative-control.sh
./scripts/prepublish-check.sh
echo "✓ all checks passed"
