#!/usr/bin/env bash
# Integration test for Cost Management plugin RBAC endpoints.
# Authenticates as real Keycloak users and hits the live backend API
# to verify RBAC enforcement on ocp-edge73.
#
# Usage: bash test-rbac-integration.sh
# Runs on: ocp-edge73 hypervisor (via SSH) or anywhere with route access
set -euo pipefail

###############################################################################
# Config
###############################################################################
RHDH_URL="https://backstage-backstage-rhdh-operator.apps.ocp-edge73-0.qe.lab.redhat.com"
KC_URL="https://keycloak-rhsso-operator.apps.ocp-edge73-0.qe.lab.redhat.com"
KC_REALM="basic"
KC_CLIENT_ID="rhdh"
KC_CLIENT_SECRET="rhdh"
USER_PASSWORD="test"

OPTIMIZATIONS_PATH="api/cost-management/proxy/recommendations/openshift"
OPENSHIFT_PATH="api/cost-management/proxy/reports/openshift/costs/"
APPLY_PATH="api/cost-management/apply-recommendation"

PASS=0
FAIL=0
TOTAL=0

###############################################################################
# Helpers
###############################################################################
red()   { printf '\033[0;31m%s\033[0m' "$*"; }
green() { printf '\033[0;32m%s\033[0m' "$*"; }
bold()  { printf '\033[1m%s\033[0m' "$*"; }

get_backstage_token() {
  local user=$1
  local kc_response kc_refresh bs_response bs_token

  kc_response=$(curl -sk -X POST \
    "${KC_URL}/auth/realms/${KC_REALM}/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password&client_id=${KC_CLIENT_ID}&client_secret=${KC_CLIENT_SECRET}&username=${user}&password=${USER_PASSWORD}&scope=openid" 2>/dev/null)

  kc_refresh=$(echo "$kc_response" | jq -r '.refresh_token // empty' 2>/dev/null)
  if [[ -z "$kc_refresh" ]]; then
    echo ""
    return
  fi

  bs_response=$(curl -sk \
    "${RHDH_URL}/api/auth/oidc/refresh?optional&scope=openid%20profile%20email&env=development" \
    -H "x-requested-with: XMLHttpRequest" \
    --cookie "oidc-refresh-token=${kc_refresh}" 2>/dev/null)

  bs_token=$(echo "$bs_response" | jq -r '.backstageIdentity.token // empty' 2>/dev/null)
  echo "$bs_token"
}

call_endpoint() {
  local token=$1 method=$2 path=$3
  shift 3
  local extra_args=("$@")

  curl -sk -o /dev/null -w "%{http_code}" \
    -X "$method" \
    "${RHDH_URL}/${path}" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    "${extra_args[@]}" 2>/dev/null
}

assert_status() {
  local test_name=$1 expected=$2 actual=$3
  TOTAL=$((TOTAL + 1))
  if [[ "$actual" == "$expected" ]]; then
    PASS=$((PASS + 1))
    echo "  $(green PASS)  ${test_name}  (HTTP ${actual})"
  else
    FAIL=$((FAIL + 1))
    echo "  $(red FAIL)  ${test_name}  (expected ${expected}, got ${actual})"
  fi
}

# For apply-recommendation, authorized users may get non-200 from Orchestrator
# (workflow not deployed). We care about the RBAC gate: 403 = denied, !403 = passed RBAC.
assert_not_403() {
  local test_name=$1 actual=$2
  TOTAL=$((TOTAL + 1))
  if [[ "$actual" != "403" ]]; then
    PASS=$((PASS + 1))
    echo "  $(green PASS)  ${test_name}  (HTTP ${actual} — RBAC allowed, forwarded to Orchestrator)"
  else
    FAIL=$((FAIL + 1))
    echo "  $(red FAIL)  ${test_name}  (HTTP 403 — RBAC blocked, should have been allowed)"
  fi
}

###############################################################################
# Test definitions: user → expected statuses
###############################################################################
# Format: "user  optimizations  openshift  apply"
# apply = expected HTTP code for POST /apply-recommendation
# Use "-" to skip a test
declare -A USERS
USERS=(
  [costmgmt-no-access]="403 403 403"
  [costmgmt-workflow-only]="403 403 -"
  [ro-read-all]="200 200 403"
  [costmgmt-full-access]="200 200 200"
  [ro-read-cluster]="403 403 -"
)

# Ordered list for consistent output
USER_ORDER=(
  "costmgmt-no-access"
  "costmgmt-workflow-only"
  "ro-read-all"
  "costmgmt-full-access"
  "ro-read-cluster"
)

APPLY_BODY='{"workflowId":"cost-management-apply-recommendation","inputData":{"clusterName":"test-cluster","resourceType":"deployment","resourceNamespace":"test-ns","resourceName":"test-workload","containerName":"test-container","containerResources":{"requests":{"cpu":100,"memory":256},"limits":{"cpu":200,"memory":512}}}}'

###############################################################################
# Run
###############################################################################
echo ""
echo "$(bold '=== Cost Management RBAC Integration Tests ===')"
echo "RHDH:     ${RHDH_URL}"
echo "Keycloak: ${KC_URL}/auth/realms/${KC_REALM}"
echo ""

for user in "${USER_ORDER[@]}"; do
  read -r exp_opt exp_ocp exp_apply <<< "${USERS[$user]}"

  echo "$(bold "--- ${user} ---")"

  token=$(get_backstage_token "$user")
  if [[ -z "$token" ]]; then
    echo "  $(red FAIL)  Could not authenticate user '${user}' via Keycloak"
    FAIL=$((FAIL + 1))
    TOTAL=$((TOTAL + 1))
    echo ""
    continue
  fi
  echo "  Authenticated OK (token ${#token} chars)"

  # Optimizations API (ROS)
  status=$(call_endpoint "$token" GET "$OPTIMIZATIONS_PATH")
  assert_status "GET  /proxy/recommendations/openshift" "$exp_opt" "$status"

  # OpenShift costs API (Cost Management)
  status=$(call_endpoint "$token" GET "$OPENSHIFT_PATH")
  assert_status "GET  /proxy/reports/openshift/costs/" "$exp_ocp" "$status"

  # Apply Recommendation
  if [[ "$exp_apply" != "-" ]]; then
    status=$(call_endpoint "$token" POST "$APPLY_PATH" -d "$APPLY_BODY")
    if [[ "$exp_apply" == "403" ]]; then
      assert_status "POST /apply-recommendation (expect DENY)" "$exp_apply" "$status"
    else
      assert_not_403 "POST /apply-recommendation (expect ALLOW)" "$status"
    fi
  fi

  echo ""
done

###############################################################################
# Summary
###############################################################################
echo "$(bold '=== Summary ===')"
echo "Total: ${TOTAL}  $(green "Pass: ${PASS}")  $(red "Fail: ${FAIL}")"
echo ""

if [[ $FAIL -gt 0 ]]; then
  echo "$(red 'SOME TESTS FAILED')"
  exit 1
else
  echo "$(green 'ALL TESTS PASSED')"
  exit 0
fi
