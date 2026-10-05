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

oci_script="$script_dir_path/generate-oci-image.sh"
docker_script="$script_dir_path/generate-docker-image.sh"

function _usage {
  cat <<EOF
Usage:
  $script_name                          Interactive: choose OCI or Docker, then version
  $script_name oci <version>            Build and push the OCI dynamic-plugin image
  $script_name docker <version>         Build and push the Backstage Docker image
  $script_name --help

Delegates to:
  generate-oci-image.sh     OCI dynamic-plugin artifact (pushes :VERSION and :latest)
  generate-docker-image.sh  Backstage app image (pushes :VERSION and :main)

Environment variables (passed through to the delegated script):
  REGISTRY_URL    Optional. Container registry URL. Default: quay.io
  ORG_ID          Optional. Organization / namespace in the registry. Default: dcm-project
  REPO            Optional. Repository name (defaults differ per script).
EOF
  return 0
}

function _assert_version {
  local version="$1"
  if [[ -z "$version" ]]; then
    echo "Error: version must be provided" >&2
    exit 1
  fi
  if [[ ! ($version =~ ^[0-9]+\.[0-9]+\.[0-9]+) ]]; then
    echo "Error: version must follow semver — e.g. 0.1.0 or 1.2.3-rc1" >&2
    exit 2
  fi
  return 0
}

function _run_oci {
  local version="$1"
  _assert_version "$version"
  echo "Running OCI image build and push (VERSION=$version)..."
  VERSION="$version" "$oci_script"
}

function _run_docker {
  local version="$1"
  shift
  _assert_version "$version"
  echo "Running Docker image build and push (VERSION=$version)..."
  VERSION="$version" "$docker_script" "$@"
}

function _interactive {
  local choice version

  echo "Select image type:"
  echo "  1) OCI     (Dynamic Plugin OCI artifact — pushes :VERSION and :latest)"
  echo "  2) Docker  (Backstage application image — pushes :VERSION and :main)"
  read -r -p "Choice [1/2]: " choice

  case "$choice" in
    1|oci|OCI)
      read -r -p "Enter version (e.g. 1.0.0): " version
      _run_oci "$version"
      ;;
    2|docker|Docker|DOCKER)
      read -r -p "Enter version (e.g. 1.0.0): " version
      _run_docker "$version"
      ;;
    *)
      echo "Error: invalid choice '$choice'. Enter 1 or 2." >&2
      exit 1
      ;;
  esac
}

if [[ $# -eq 0 ]]; then
  _interactive
elif [[ $1 =~ -h|--help ]]; then
  _usage
elif [[ "$1" == "oci" ]]; then
  if [[ $# -lt 2 ]]; then
    echo "Error: version required. Usage: $script_name oci <version>" >&2
    exit 1
  fi
  _run_oci "$2"
elif [[ "$1" == "docker" ]]; then
  if [[ $# -lt 2 ]]; then
    echo "Error: version required. Usage: $script_name docker <version>" >&2
    exit 1
  fi
  _run_docker "$2" "${@:3}"
else
  echo "Error: unknown argument '$1'" >&2
  _usage
  exit 1
fi
