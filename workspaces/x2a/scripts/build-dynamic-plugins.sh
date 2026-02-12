#!/usr/bin/env bash
#
# Build x2a dynamic plugins and package them as OCI images.
#
# Usage: ./scripts/build-dynamic-plugins.sh
#
# Produces two OCI images:
#   quay.io/x2ansible/red-hat-developer-hub-backstage-plugin-x2a:<version>
#   quay.io/x2ansible/red-hat-developer-hub-backstage-plugin-x2a-backend:<version>
#
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RHDH_CLI_VERSION="1.9.1"
EMBED_PACKAGE="@red-hat-developer-hub/backstage-plugin-x2a-common"
IMAGE_REGISTRY="quay.io/x2ansible"

declare -A PLUGIN_IMAGES=(
  ["x2a"]="red-hat-developer-hub-backstage-plugin-x2a"
  ["x2a-backend"]="red-hat-developer-hub-backstage-plugin-x2a-backend"
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
  yarn install --cwd "$WORKSPACE_DIR"
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

  log "Exporting dynamic plugin: ${plugin_dir}"
  (cd "$plugin_path" && npx "@red-hat-developer-hub/cli@${RHDH_CLI_VERSION}" plugin export \
    --embed-package "$EMBED_PACKAGE")
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

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
  check_prerequisites
  install_dependencies
  build_workspace

  for plugin_dir in "${!PLUGIN_IMAGES[@]}"; do
    export_plugin "$plugin_dir"
    package_plugin "$plugin_dir"
  done

  log "Done. Images built:"
  podman images --filter "reference=${IMAGE_REGISTRY}/*"
}

main "$@"
