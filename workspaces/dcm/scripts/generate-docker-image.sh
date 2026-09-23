#!/usr/bin/env bash
# Copyright Red Hat, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -eu

script_name="${BASH_SOURCE:-$0}"
script_path=$(realpath "$script_name")
script_dir_path=$(dirname "$script_path")
workspace_dir=$(dirname "$script_dir_path")

REGISTRY_URL="${REGISTRY_URL:-quay.io}"
ORG_ID="${ORG_ID:-dcm-project}"
REPO="${REPO:-dcm-ui}"
VERSION="${VERSION:-}"

function _usage {
  cat <<EOF
Usage:
  VERSION=<semver> $script_name [--no-cache]
  $script_name --help

Builds the Backstage application Docker image and always pushes both
:\$VERSION and :main tags to the registry.

Environment variables:
  VERSION         Required. The image version tag.
  REGISTRY_URL    Optional. Container registry URL. Default: quay.io
  ORG_ID          Optional. Organization / namespace in the registry. Default: dcm-project
  REPO            Optional. Repository name. Default: dcm-ui

Options:
  --no-cache      Rebuild all layers from scratch.
EOF
  return 0
}

# Prefer podman; fall back to docker.
_pocker="$(command -v podman || command -v docker)"

function _assert_version_is_set {
  if [[ -z "$VERSION" ]]; then
    echo "Error: The VERSION environment variable must be provided" >&2
    exit 1
  fi

  if [[ ! ($VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+) ]]; then
    echo "Error: VERSION must follow semver — e.g. 0.1.0 or 1.2.3-rc1" >&2
    exit 2
  fi
  return 0
}

function build_and_push {
  _assert_version_is_set

  local image_tag="$REGISTRY_URL/$ORG_ID/$REPO:$VERSION"
  local main_tag="$REGISTRY_URL/$ORG_ID/$REPO:main"
  local no_cache=false

  for arg in "$@"; do
    if [[ "$arg" == "--no-cache" ]]; then
      no_cache=true
    elif [[ "$arg" =~ -h|--help ]]; then
      _usage
      return 0
    elif [[ "$arg" == "--push" ]]; then
      # Accepted for backward compatibility; push is always performed.
      :
    else
      echo "Error: unknown argument '$arg'" >&2
      _usage
      exit 1
    fi
  done

  # Mount the host's global Yarn cache into the build container so that packages
  # already downloaded locally don't need to be re-fetched from the registry.
  # The cache path is discovered at runtime; if it doesn't exist we skip the mount.
  local yarn_cache_dir
  yarn_cache_dir=$(yarn config get cacheFolder 2>/dev/null || true)

  local volume_args=()
  if [[ -n "$yarn_cache_dir" && -d "$yarn_cache_dir" ]]; then
    echo "Mounting Yarn cache: $yarn_cache_dir -> /root/.yarn/berry/cache (read-only)"
    volume_args=("--volume" "$yarn_cache_dir:/root/.yarn/berry/cache:Z")
  fi

  local cache_args=()
  if $no_cache; then
    cache_args=("--no-cache")
  fi

  echo "Building Backstage app image: $image_tag (also tagging $main_tag)"
  "$_pocker" build \
    "${cache_args[@]+"${cache_args[@]}"}" \
    "${volume_args[@]+"${volume_args[@]}"}" \
    --tag "$image_tag" \
    --tag "$main_tag" \
    "$workspace_dir"

  echo "Pushing $image_tag"
  "$_pocker" push "$image_tag"
  echo "Pushing $main_tag"
  "$_pocker" push "$main_tag"
  return 0
}

if [[ $# -gt 0 && $1 =~ -h|--help ]]; then
  _usage
else
  build_and_push "$@"
fi
