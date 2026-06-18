#!/usr/bin/env bash
# Pre-script wrapper: upstream validation + auto-rebase onto target branch.
#
# Runs the upstream pre-fix.sh (input checks, iteration cap), then rebases
# the PR branch onto origin/${TARGET_BRANCH} so the agent always works on
# a current base. Force-pushes the rebased branch while the token is fresh.
#
# Required env (from runner_env in fix.yaml):
#   REPO_DIR, TARGET_BRANCH, PUSH_TOKEN, REPO_FULL_NAME
set -euo pipefail

# 1. Run upstream validation (input checks, iteration cap)
bash scripts/pre-fix.sh

# 2. Rebase PR branch onto target branch
cd "${REPO_DIR}"
git fetch origin "${TARGET_BRANCH}"

CURRENT_HEAD="$(git rev-parse HEAD)"
TARGET_HEAD="$(git rev-parse "origin/${TARGET_BRANCH}")"
MERGE_BASE="$(git merge-base HEAD "origin/${TARGET_BRANCH}")"

if [[ "${MERGE_BASE}" == "${TARGET_HEAD}" ]]; then
  echo "Branch is already up-to-date with origin/${TARGET_BRANCH}. Skipping rebase."
  exit 0
fi

BEHIND_COUNT="$(git rev-list --count HEAD.."origin/${TARGET_BRANCH}")"
echo "Branch is ${BEHIND_COUNT} commit(s) behind origin/${TARGET_BRANCH}. Rebasing..."

if ! git rebase "origin/${TARGET_BRANCH}" 2>&1; then
  git rebase --abort 2>/dev/null || true
  echo "::error::Rebase onto origin/${TARGET_BRANCH} failed with conflicts." >&2
  echo "::error::Please rebase manually and re-trigger /fs-fix." >&2
  exit 1
fi

NEW_HEAD="$(git rev-parse HEAD)"
echo "Rebase succeeded: ${CURRENT_HEAD:0:7} → ${NEW_HEAD:0:7}"

# 3. Force-push the rebased branch (token is fresh here)
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git remote set-url origin \
  "https://x-access-token:${PUSH_TOKEN}@github.com/${REPO_FULL_NAME}.git"
echo "Force-pushing rebased branch ${BRANCH}..."
git push --force-with-lease origin "${BRANCH}" 2>&1
echo "Rebase push complete."
