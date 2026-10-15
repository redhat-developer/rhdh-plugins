#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Import demo code-coverage data into a local Backstage instance.
#
# Prerequisites:
#   - A running Backstage backend at BACKSTAGE_URL (default: http://localhost:7007)
#   - The code-coverage-backend plugin installed and enabled
#   - The entity "component:default/code-coverage-scorecard-only" registered
#     in the catalog (included in examples/all-scorecards-location.yaml)
#
# Usage:
#   ./import.sh                          # import with defaults
#   BACKSTAGE_URL=http://host:7007 ./import.sh   # custom backend URL
#   ENTITY_REF=component:default/my-svc ./import.sh  # custom entity
# ---------------------------------------------------------------------------
set -euo pipefail

BACKSTAGE_URL="${BACKSTAGE_URL:-http://localhost:7007}"
ENTITY_REF="${ENTITY_REF:-component:default/code-coverage-scorecard-only}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COVERAGE_FILE="${SCRIPT_DIR}/cobertura-coverage.xml"

if [ ! -f "${COVERAGE_FILE}" ]; then
  echo "Error: coverage file not found: ${COVERAGE_FILE}" >&2
  exit 1
fi

ENCODED_ENTITY=$(printf '%s' "${ENTITY_REF}" | sed 's/:/%3A/g; s/\//%2F/g')
URL="${BACKSTAGE_URL}/api/code-coverage/report?entity=${ENCODED_ENTITY}&coverageType=cobertura"

echo "Importing code-coverage data..."
echo "  Backend:  ${BACKSTAGE_URL}"
echo "  Entity:   ${ENTITY_REF}"
echo "  File:     ${COVERAGE_FILE}"
echo ""

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${URL}" \
  -H 'Content-Type: text/xml' \
  ${SERVICE_TOKEN:+-H "Authorization: Bearer ${SERVICE_TOKEN}"} \
  --data-binary "@${COVERAGE_FILE}")

if [ "${HTTP_CODE}" -ge 200 ] && [ "${HTTP_CODE}" -lt 300 ]; then
  echo "Success (HTTP ${HTTP_CODE}): coverage data imported for ${ENTITY_REF}"
else
  echo "Error (HTTP ${HTTP_CODE}): failed to import coverage data" >&2
  echo "Verify the code-coverage-backend plugin is running and the entity is registered." >&2
  exit 1
fi
