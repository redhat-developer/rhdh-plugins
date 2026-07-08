#!/usr/bin/env bash
# Load boost dev secrets from a K8s namespace.
# Source this before launching the debugger:
#   source workspaces/boost/scripts/load-secrets.sh
#
# Override defaults via env vars:
#   BOOST_SECRET_NAMESPACE  (default: rolling-demo-ns)
#   BOOST_SECRET_NAME       (default: augment-secrets)
#
# Requires: kubectl access to the cluster (KUBECONFIG set)

NAMESPACE="${BOOST_SECRET_NAMESPACE:-rolling-demo-ns}"
SECRET_NAME="${BOOST_SECRET_NAME:-augment-secrets}"

echo "Loading secrets from ${NAMESPACE}/${SECRET_NAME}..."

_load_field() {
  local val
  val=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
    -o jsonpath="{.data.$1}" 2>/dev/null) || {
    echo "  WARNING: failed to read $1 from secret ${NAMESPACE}/${SECRET_NAME}" >&2
    return 1
  }
  if [[ -z "${val}" ]]; then
    echo "  WARNING: $1 is empty in secret ${NAMESPACE}/${SECRET_NAME}" >&2
    return 1
  fi
  echo "${val}" | base64 -d
}

KAGENTI_CLIENT_SECRET=$(_load_field KAGENTI_CLIENT_SECRET)      || { echo "Aborting." >&2; unset -f _load_field; return 1; }
KAGENTI_CLIENT_ID=$(_load_field KAGENTI_CLIENT_ID)              || { echo "Aborting." >&2; unset -f _load_field; return 1; }
KAGENTI_TOKEN_ENDPOINT=$(_load_field KAGENTI_TOKEN_ENDPOINT)    || { echo "Aborting." >&2; unset -f _load_field; return 1; }
KAGENTI_BASE_URL=$(_load_field KAGENTI_BASE_URL)                || { echo "Aborting." >&2; unset -f _load_field; return 1; }
KAGENTI_NAMESPACE=$(_load_field KAGENTI_NAMESPACE)              || { echo "Aborting." >&2; unset -f _load_field; return 1; }
BOOST_MODEL=$(_load_field AUGMENT_MODEL)                        || { echo "Aborting." >&2; unset -f _load_field; return 1; }

unset -f _load_field

# Discover Llama Stack route via OGX operator labels (best-effort)
_discover_llama_stack_route() {
  local route_host=""
  local label
  for label in "ogx.io/watch=true" \
               "app.kubernetes.io/managed-by=ogx-operator" \
               "app.kubernetes.io/part-of=ogx"; do
    route_host=$(kubectl get routes --all-namespaces \
      -l "$label" \
      -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.host}{"\n"}{end}' 2>/dev/null \
      | grep -i "llama" \
      | head -1 \
      | awk '{print $2}')
    if [[ -n "$route_host" ]]; then
      echo "https://${route_host}"
      return 0
    fi
  done
  return 1
}

BOOST_LLAMA_STACK_URL=$(_discover_llama_stack_route) || {
  echo "  WARNING: no Llama Stack route found via OGX labels — set BOOST_LLAMA_STACK_URL manually" >&2
}

unset -f _discover_llama_stack_route

export KAGENTI_CLIENT_SECRET KAGENTI_CLIENT_ID KAGENTI_TOKEN_ENDPOINT
export KAGENTI_BASE_URL KAGENTI_NAMESPACE BOOST_MODEL
if [[ -n "$BOOST_LLAMA_STACK_URL" ]]; then
  export BOOST_LLAMA_STACK_URL
fi
export NODE_TLS_REJECT_UNAUTHORIZED=0

echo "Loaded: KAGENTI_BASE_URL=$KAGENTI_BASE_URL"
echo "Loaded: KAGENTI_NAMESPACE=$KAGENTI_NAMESPACE"
echo "Loaded: KAGENTI_CLIENT_ID=$KAGENTI_CLIENT_ID"
echo "Loaded: KAGENTI_CLIENT_SECRET=<set>"
echo "Loaded: KAGENTI_TOKEN_ENDPOINT=$KAGENTI_TOKEN_ENDPOINT"
echo "Loaded: BOOST_MODEL=$BOOST_MODEL"
echo "Loaded: BOOST_LLAMA_STACK_URL=${BOOST_LLAMA_STACK_URL:-<not discovered>}"
echo "Set:    NODE_TLS_REJECT_UNAUTHORIZED=0 (for self-signed OpenShift route certs)"
echo "Ready — launch the debugger in this shell."
