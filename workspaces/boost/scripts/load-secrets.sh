#!/usr/bin/env bash
# Load development secrets from a Kubernetes secret into environment
# variables for local boost backend development.
#
# Usage:
#   source scripts/load-secrets.sh [secret-name] [namespace]
#
# Defaults:
#   secret-name: boost-dev-secrets
#   namespace:   boost-dev

set -euo pipefail

SECRET_NAME="${1:-boost-dev-secrets}"
NAMESPACE="${2:-boost-dev}"

echo "Loading secrets from ${NAMESPACE}/${SECRET_NAME}..."

# Read fields from the K8s secret
export KAGENTI_CLIENT_SECRET
KAGENTI_CLIENT_SECRET=$(kubectl get secret "${SECRET_NAME}" \
  -n "${NAMESPACE}" -o jsonpath='{.data.KAGENTI_CLIENT_SECRET}' | base64 -d)

export KAGENTI_CLIENT_ID
KAGENTI_CLIENT_ID=$(kubectl get secret "${SECRET_NAME}" \
  -n "${NAMESPACE}" -o jsonpath='{.data.KAGENTI_CLIENT_ID}' | base64 -d)

export KAGENTI_TOKEN_ENDPOINT
KAGENTI_TOKEN_ENDPOINT=$(kubectl get secret "${SECRET_NAME}" \
  -n "${NAMESPACE}" -o jsonpath='{.data.KAGENTI_TOKEN_ENDPOINT}' | base64 -d)

export KAGENTI_BASE_URL
KAGENTI_BASE_URL=$(kubectl get secret "${SECRET_NAME}" \
  -n "${NAMESPACE}" -o jsonpath='{.data.KAGENTI_BASE_URL}' | base64 -d)

export KAGENTI_NAMESPACE
KAGENTI_NAMESPACE=$(kubectl get secret "${SECRET_NAME}" \
  -n "${NAMESPACE}" -o jsonpath='{.data.KAGENTI_NAMESPACE}' | base64 -d)

export BOOST_MODEL
BOOST_MODEL=$(kubectl get secret "${SECRET_NAME}" \
  -n "${NAMESPACE}" -o jsonpath='{.data.BOOST_MODEL}' | base64 -d)

# Accept self-signed certs from OpenShift routes (override with 1 to enforce)
export NODE_TLS_REJECT_UNAUTHORIZED="${NODE_TLS_REJECT_UNAUTHORIZED:-0}"

echo "Environment loaded:"
echo "  KAGENTI_CLIENT_SECRET=<set>"
echo "  KAGENTI_CLIENT_ID=<set>"
echo "  KAGENTI_TOKEN_ENDPOINT=${KAGENTI_TOKEN_ENDPOINT}"
echo "  KAGENTI_BASE_URL=${KAGENTI_BASE_URL}"
echo "  KAGENTI_NAMESPACE=${KAGENTI_NAMESPACE}"
echo "  BOOST_MODEL=${BOOST_MODEL}"
echo "  NODE_TLS_REJECT_UNAUTHORIZED=${NODE_TLS_REJECT_UNAUTHORIZED}"
