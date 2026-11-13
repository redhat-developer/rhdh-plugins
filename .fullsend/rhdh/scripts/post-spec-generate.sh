#!/usr/bin/env bash
# Ensure a successful spec commit is publishable, then delegate to the stock
# code post-script for validation, push, and pull-request creation.

set -euo pipefail

RUN_DIR="$(pwd)"
REPO_DIR="${REPO_DIR:-repo}"
TARGET_BRANCH="main"

if [[ ! -d "${REPO_DIR}" ]]; then
  echo "::error::Extracted repo not found at ${REPO_DIR}"
  exit 1
fi

CURRENT_BRANCH="$(git -C "${REPO_DIR}" branch --show-current)"
case "${CURRENT_BRANCH}" in
  ""|main|master)
    if ! git -C "${REPO_DIR}" rev-parse --verify --quiet \
      "refs/remotes/origin/${TARGET_BRANCH}" >/dev/null; then
      echo "::error::Cannot verify origin/${TARGET_BRANCH} before publishing the spec"
      exit 1
    fi

    AHEAD_COUNT="$(git -C "${REPO_DIR}" rev-list --count \
      "origin/${TARGET_BRANCH}..HEAD")"
    if [[ "${AHEAD_COUNT}" -gt 0 ]]; then
      WORK_ITEM_KEY="${FULLSEND_WORK_ITEM_KEY:-}"
      if [[ -z "${WORK_ITEM_KEY}" ]]; then
        WORK_ITEM_URL="${FULLSEND_WORK_ITEM_URL:-${ISSUE_URL:-}}"
        WORK_ITEM_KEY="${WORK_ITEM_URL%/}"
        WORK_ITEM_KEY="${WORK_ITEM_KEY##*/}"
      fi
      if [[ -z "${WORK_ITEM_KEY}" ]]; then
        WORK_ITEM_KEY="${ISSUE_NUMBER:-}"
      fi
      if [[ ! "${WORK_ITEM_KEY}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]]; then
        echo "::error::Cannot derive a safe work-item key for the spec branch"
        exit 1
      fi

      SPEC_BRANCH="agent/${WORK_ITEM_KEY}-spec"
      echo "::notice::Moving ${AHEAD_COUNT} spec commit(s) from ${CURRENT_BRANCH:-detached HEAD} to ${SPEC_BRANCH}"
      git -C "${REPO_DIR}" switch -c "${SPEC_BRANCH}"
    fi
    ;;
esac

SCRIPTS_SHA="${SPEC_GENERATE_BASE_SCRIPTS_SHA256:-}"
if [[ ! "${SCRIPTS_SHA}" =~ ^[0-9a-f]{64}$ ]]; then
  echo "::error::SPEC_GENERATE_BASE_SCRIPTS_SHA256 is missing or invalid"
  exit 1
fi

WORKSPACE_DIR="${GITHUB_WORKSPACE:-${RUN_DIR}}"
BASE_POST_SCRIPT="${WORKSPACE_DIR}/.fullsend/.fullsend-cache/resources/sha256/${SCRIPTS_SHA}/scripts/post-code.sh"
if [[ ! -f "${BASE_POST_SCRIPT}" ]]; then
  echo "::error::Pinned stock post-code.sh not found at ${BASE_POST_SCRIPT}"
  exit 1
fi

exec bash "${BASE_POST_SCRIPT}"
