#!/usr/bin/env bash
# Idempotent yarn setup for fullsend sandbox.
#
# The sandbox image has corepack but no global yarn binary, and /usr/bin is
# read-only. This script:
#   1. Configures yarn to use the sandbox proxy (DNS is unreachable)
#   2. Runs corepack enable into writable /sandbox/.corepack/bin
#   3. Pre-downloads the yarn binary via corepack prepare
#   4. Drops a yarn wrapper into /tmp/workspace/bin/ so git hooks (husky)
#      can find yarn — they run in subprocesses without the agent's PATH
#
# Designed to be `source`d so PATH export persists in the caller's shell.
# Saves and restores shell options to avoid side effects on the caller.

_sandbox_yarn_saved_opts=$(set +o)
set -euo pipefail

# The sandbox runs in a nested network namespace where DNS is unreachable
# (resolv.conf points to 10.89.0.1 which is outside the netns). All network
# must go through the L7 transparent proxy at 10.200.0.1:3128. HTTP/HTTPS
# traffic is intercepted transparently, but tools that resolve DNS before
# connecting (yarn, pip, git clone) fail with EAI_AGAIN.
#
# Fix: tell yarn to use the proxy explicitly. Yarn Berry ignores the standard
# HTTP_PROXY/HTTPS_PROXY env vars (yarnpkg/berry#1531) but reads YARN_HTTP_PROXY
# and YARN_HTTPS_PROXY (YARN_ prefix maps to .yarnrc.yml keys).
export YARN_HTTP_PROXY="http://10.200.0.1:3128"
export YARN_HTTPS_PROXY="http://10.200.0.1:3128"

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
#!/usr/bin/env bash
export COREPACK_HOME=/sandbox/.corepack
exec /usr/bin/corepack yarn "$@"
WRAPPER
chmod +x /tmp/workspace/bin/yarn

if yarn --version >/dev/null 2>&1; then
  echo "YARN_SETUP_OK: $(yarn --version 2>/dev/null)"
  eval "$_sandbox_yarn_saved_opts"
  unset _sandbox_yarn_saved_opts
else
  echo "YARN_SETUP_FAILED" >&2
  eval "$_sandbox_yarn_saved_opts"
  unset _sandbox_yarn_saved_opts
  return 1 2>/dev/null || exit 1
fi
