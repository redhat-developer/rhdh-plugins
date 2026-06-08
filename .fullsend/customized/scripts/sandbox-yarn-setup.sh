#!/usr/bin/env bash
# Idempotent yarn setup for fullsend sandbox.
# The sandbox image has corepack but no global yarn binary, and /usr/bin is
# read-only. This script installs yarn into the writable /sandbox/.corepack
# directory. Designed to be `source`d so PATH changes persist in the caller.
set -euo pipefail

export COREPACK_HOME=/sandbox/.corepack
mkdir -p "$COREPACK_HOME/bin"
corepack enable --install-directory "$COREPACK_HOME/bin"
export PATH="$COREPACK_HOME/bin:$PATH"

if yarn --version >/dev/null 2>&1; then
  echo "YARN_SETUP_OK: $(yarn --version)"
else
  echo "YARN_SETUP_FAILED" >&2
  exit 1
fi
