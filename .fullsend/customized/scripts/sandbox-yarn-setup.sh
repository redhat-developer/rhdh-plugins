#!/usr/bin/env bash
# Idempotent yarn setup for fullsend sandbox.
#
# The sandbox image has corepack but no global yarn binary, and /usr/bin is
# read-only. This script:
#   1. Runs corepack enable into writable /sandbox/.corepack/bin
#   2. Pre-downloads the yarn binary via corepack prepare
#   3. Drops a yarn wrapper into /tmp/workspace/bin/ so git hooks (husky)
#      can find yarn — they run in subprocesses without the agent's PATH
#
# Designed to be `source`d so PATH export persists in the caller's shell.
set -euo pipefail

export COREPACK_HOME=/sandbox/.corepack
mkdir -p "$COREPACK_HOME/bin"

# Create yarn/yarnpkg shims in writable directory
corepack enable --install-directory "$COREPACK_HOME/bin"
export PATH="$COREPACK_HOME/bin:$PATH"

# Pre-download yarn binary so first invocation doesn't trigger a network fetch.
# Reads packageManager version from the closest package.json.
corepack prepare --activate 2>/dev/null || true

# Drop a wrapper into /tmp/workspace/bin/ (already in git hook PATH) so that
# husky's `yarn lint-staged` works without the agent's modified PATH.
mkdir -p /tmp/workspace/bin
cat > /tmp/workspace/bin/yarn << 'WRAPPER'
#!/bin/bash
export COREPACK_HOME=/sandbox/.corepack
exec /usr/bin/corepack yarn "$@"
WRAPPER
chmod +x /tmp/workspace/bin/yarn

if yarn --version >/dev/null 2>&1; then
  echo "YARN_SETUP_OK: $(yarn --version 2>/dev/null)"
else
  echo "YARN_SETUP_FAILED" >&2
  exit 1
fi
