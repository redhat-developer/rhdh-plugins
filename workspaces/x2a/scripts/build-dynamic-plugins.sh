#!/usr/bin/env bash
#
# Build x2a dynamic plugins and package them as OCI images.
#
# Usage: ./scripts/build-dynamic-plugins.sh [--push]
#
# Options:
#   --push    Push built images to the registry after packaging
#
# Produces OCI images:
#   quay.io/x2ansible/red-hat-developer-hub-backstage-plugin-x2a:<version>
#   quay.io/x2ansible/red-hat-developer-hub-backstage-plugin-x2a-backend:<version>
#
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RHDH_CLI_VERSION="1.9.1"
EMBED_COMMON="@red-hat-developer-hub/backstage-plugin-x2a-common"
EMBED_NODE="@red-hat-developer-hub/backstage-plugin-x2a-node"
IMAGE_REGISTRY="quay.io/x2ansible"
PUSH_IMAGES=false

# Per-plugin embed packages. Plugins that depend on x2a-node (workspace dep)
# must embed it alongside x2a-common so the RHDH CLI moves shared deps to
# peerDependencies. Plugins not listed here get only x2a-common.
declare -A PLUGIN_EMBED_PACKAGES=(
  ["x2a-backend"]="${EMBED_COMMON} ${EMBED_NODE}"
  ["x2a-mcp-extras"]="${EMBED_COMMON} ${EMBED_NODE}"
)

declare -A PLUGIN_IMAGES=(
  ["x2a"]="red-hat-developer-hub-backstage-plugin-x2a"
  ["x2a-backend"]="red-hat-developer-hub-backstage-plugin-x2a-backend"
  ["x2a-dcr"]="red-hat-developer-hub-backstage-plugin-x2a-dcr"
  ["x2a-mcp-extras"]="red-hat-developer-hub-backstage-plugin-x2a-mcp-extras"
  ["scaffolder-backend-module-x2a"]="red-hat-developer-hub-backstage-plugin-scaffolder-backend-module-x2a"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log() {
  echo "==> $*"
}

check_prerequisites() {
  local missing=()
  for cmd in node yarn npx podman; do
    if ! command -v "$cmd" &>/dev/null; then
      missing+=("$cmd")
    fi
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "ERROR: missing required commands: ${missing[*]}" >&2
    exit 1
  fi
}

get_plugin_version() {
  local plugin_dir="$1"
  local pkg_json="${WORKSPACE_DIR}/plugins/${plugin_dir}/package.json"
  node -e "console.log(require('${pkg_json}').version)"
}

install_dependencies() {
  log "Installing workspace dependencies"
  yarn --cwd "$WORKSPACE_DIR" install
}

build_workspace() {
  log "Building all workspace packages"
  yarn --cwd "$WORKSPACE_DIR" build:all
}

clean_dist_dynamic() {
  local plugin_dir="$1"
  local dist_path="${WORKSPACE_DIR}/plugins/${plugin_dir}/dist-dynamic"

  if [[ -d "$dist_path" ]]; then
    log "Cleaning stale dist-dynamic: ${plugin_dir}"
    rm -rf "$dist_path"
  fi
}

export_plugin() {
  local plugin_dir="$1"
  local plugin_path="${WORKSPACE_DIR}/plugins/${plugin_dir}"

  if [[ ! -d "$plugin_path" ]]; then
    echo "ERROR: plugin directory not found: $plugin_path" >&2
    exit 1
  fi

  clean_dist_dynamic "$plugin_dir"

  local embed_list="${PLUGIN_EMBED_PACKAGES[$plugin_dir]:-$EMBED_COMMON}"
  local embed_args=()
  for pkg in $embed_list; do
    embed_args+=(--embed-package "$pkg")
  done

  log "Exporting dynamic plugin: ${plugin_dir}"
  (cd "$plugin_path" && npx "@red-hat-developer-hub/cli@${RHDH_CLI_VERSION}" plugin export \
    "${embed_args[@]}")
}

package_plugin() {
  local plugin_dir="$1"
  local plugin_path="${WORKSPACE_DIR}/plugins/${plugin_dir}"
  local image_name="${PLUGIN_IMAGES[$plugin_dir]}"
  local version
  version="$(get_plugin_version "$plugin_dir")"
  local image_tag="${IMAGE_REGISTRY}/${image_name}:${version}"

  log "Packaging plugin image: ${image_tag}"
  (cd "$plugin_path" && npx "@red-hat-developer-hub/cli@${RHDH_CLI_VERSION}" plugin package \
    -t "$image_tag")
}

push_plugin() {
  local plugin_dir="$1"
  local image_name="${PLUGIN_IMAGES[$plugin_dir]}"
  local version
  version="$(get_plugin_version "$plugin_dir")"
  local image_tag="${IMAGE_REGISTRY}/${image_name}:${version}"

  log "Pushing image: ${image_tag}"
  podman push "$image_tag"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

parse_args() {
  for arg in "$@"; do
    case "$arg" in
      --push) PUSH_IMAGES=true ;;
      *) echo "ERROR: unknown argument: $arg" >&2; exit 1 ;;
    esac
  done
}

main() {
  parse_args "$@"
  check_prerequisites
  install_dependencies
  build_workspace

  for plugin_dir in "${!PLUGIN_IMAGES[@]}"; do
    export_plugin "$plugin_dir"
    package_plugin "$plugin_dir"
  done

  log "Done. Images built:"
  podman images --filter "reference=${IMAGE_REGISTRY}/*"

  if [[ "$PUSH_IMAGES" == true ]]; then
    for plugin_dir in "${!PLUGIN_IMAGES[@]}"; do
      push_plugin "$plugin_dir"
    done
    log "All images pushed."
  fi
}

main "$@"
