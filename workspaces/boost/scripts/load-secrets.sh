#!/usr/bin/env bash
# Load boost dev secrets from the rolling-demo-ns K8s namespace.
# Source this before launching the WebStorm debugger:
#   source workspaces/boost/scripts/load-secrets.sh
#
# Requires: kubectl access to the cluster (KUBECONFIG set)

set -euo pipefail

NAMESPACE="${BOOST_SECRET_NAMESPACE:-rolling-demo-ns}"
SECRET_NAME="${BOOST_SECRET_NAME:-augment-secrets}"

echo "Loading secrets from ${NAMESPACE}/${SECRET_NAME}..."

export KAGENTI_CLIENT_SECRET
KAGENTI_CLIENT_SECRET=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
  -o jsonpath='{.data.KAGENTI_CLIENT_SECRET}' | base64 -d)

export KAGENTI_CLIENT_ID
KAGENTI_CLIENT_ID=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
  -o jsonpath='{.data.KAGENTI_CLIENT_ID}' | base64 -d)

export KAGENTI_TOKEN_ENDPOINT
KAGENTI_TOKEN_ENDPOINT=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
  -o jsonpath='{.data.KAGENTI_TOKEN_ENDPOINT}' | base64 -d)

export KAGENTI_BASE_URL
KAGENTI_BASE_URL=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
  -o jsonpath='{.data.KAGENTI_BASE_URL}' | base64 -d)

export KAGENTI_NAMESPACE
KAGENTI_NAMESPACE=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
  -o jsonpath='{.data.KAGENTI_NAMESPACE}' | base64 -d)

export BOOST_MODEL
BOOST_MODEL=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
  -o jsonpath='{.data.AUGMENT_MODEL}' | base64 -d)

echo "Loaded: KAGENTI_BASE_URL=$KAGENTI_BASE_URL"
echo "Loaded: KAGENTI_NAMESPACE=$KAGENTI_NAMESPACE"
echo "Loaded: KAGENTI_CLIENT_ID=<set>"
echo "Loaded: KAGENTI_CLIENT_SECRET=<set>"
echo "Loaded: KAGENTI_TOKEN_ENDPOINT=$KAGENTI_TOKEN_ENDPOINT"
export NODE_TLS_REJECT_UNAUTHORIZED=0

echo "Loaded: BOOST_MODEL=$BOOST_MODEL"
echo "Set:    NODE_TLS_REJECT_UNAUTHORIZED=0 (for self-signed OpenShift route certs)"
echo "Ready — launch the debugger in this shell."
