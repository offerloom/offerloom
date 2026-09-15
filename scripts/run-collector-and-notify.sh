#!/bin/bash
# Runs the collector, then always sends the sync summary email (mirrors the
# "if: always()" step order that used to live in .github/workflows/collector.yml
# before collection moved back to this Mac).
set -uo pipefail
cd "$(dirname "$0")/.."
node scripts/browser-collector.mjs scripts/collector-config.json --d1-remote --auto-approve
node scripts/send-sync-email.mjs
