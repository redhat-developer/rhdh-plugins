#!/usr/bin/env bash
# Start a disposable PostgreSQL 18 container for local test runs.
#
# Usage:
#   eval "$(./scripts/start-test-postgres.sh)"
#   yarn test          # now runs against the external PostgreSQL instance
#
# The container is removed automatically when stopped:
#   podman stop x2a-test-postgres   # or: docker stop x2a-test-postgres

set -euo pipefail

CONTAINER_NAME="x2a-test-postgres"
POSTGRES_PASSWORD="testpassword"
HOST_PORT="${X2A_TEST_POSTGRES_PORT:-5433}"
IMAGE="${BACKSTAGE_TEST_DOCKER_REGISTRY:-}postgres:18"

runtime="docker"
if command -v podman &>/dev/null && ! command -v docker &>/dev/null; then
  runtime="podman"
fi

if "$runtime" ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER_NAME"; then
  >&2 echo "Container '$CONTAINER_NAME' is already running on port $HOST_PORT."
else
  >&2 echo "Starting PostgreSQL 18 container '$CONTAINER_NAME' on port $HOST_PORT …"
  "$runtime" run -d --rm \
    --name "$CONTAINER_NAME" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -p "${HOST_PORT}:5432" \
    "$IMAGE" >/dev/null

  >&2 echo "Waiting for PostgreSQL to accept connections …"
  for _ in $(seq 1 30); do
    if "$runtime" exec "$CONTAINER_NAME" pg_isready -U postgres &>/dev/null; then
      break
    fi
    sleep 1
  done
fi

echo "export BACKSTAGE_TEST_DATABASE_POSTGRES18_CONNECTION_STRING=\"postgresql://postgres:${POSTGRES_PASSWORD}@localhost:${HOST_PORT}/postgres\""
