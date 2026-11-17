#!/usr/bin/env bash
# Run on the trusted runner before Fullsend copies the target into its
# read-only sandbox. Never execute scripts from the PR checkout.
set -euo pipefail

: "${TARGET_REPO_DIR:?TARGET_REPO_DIR is required}"
: "${SPEC_AUDIT_CONTEXT_FILE:?SPEC_AUDIT_CONTEXT_FILE is required}"
: "${GH_TOKEN:?GH_TOKEN is required}"

if [[ ! "${REPO_FULL_NAME:-}" =~ ^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$ ]] \
  || [[ ! "${PR_NUMBER:-}" =~ ^[1-9][0-9]*$ ]]; then
  echo "::error::Invalid audit repository or PR number" >&2
  exit 1
fi

metadata=$(gh pr view "${PR_NUMBER}" --repo "${REPO_FULL_NAME}" \
  --json state,headRefOid)
state=$(jq -er '.state' <<< "${metadata}")
if [[ "${state}" == "CLOSED" || "${state}" == "MERGED" ]]; then
  echo "PR is closed or merged; skipping the audit"
  exit 78
fi
if [[ "${state}" != "OPEN" ]]; then
  echo "::error::Could not verify that the audit PR is open" >&2
  exit 1
fi
head_sha=$(jq -er '.headRefOid | select(test("^[0-9a-f]{40}$"))' <<< "${metadata}")

# Fetch the base repository's PR ref, which also covers fork PRs. Credentials
# stay in the runner environment; no token is embedded in the remote URL.
git -C "${TARGET_REPO_DIR}" \
  -c credential.helper= -c 'credential.helper=!gh auth git-credential' \
  fetch --no-tags --depth=1 "https://github.com/${REPO_FULL_NAME}.git" \
  "refs/pull/${PR_NUMBER}/head"
fetched_sha=$(git -C "${TARGET_REPO_DIR}" rev-parse FETCH_HEAD)
if [[ "${fetched_sha}" != "${head_sha}" ]]; then
  echo "::error::PR head changed while preparing the audit; rerun /fs-spec audit" >&2
  exit 1
fi

# Disable checkout hooks and submodule updates for untrusted PR contents.
git -C "${TARGET_REPO_DIR}" -c core.hooksPath=/dev/null \
  -c submodule.recurse=false checkout --detach "${head_sha}"
if [[ "$(git -C "${TARGET_REPO_DIR}" rev-parse HEAD)" != "${head_sha}" ]]; then
  echo "::error::Audit checkout does not match the verified PR head" >&2
  exit 1
fi

# The post-script reads this runner-owned file, never a copy from the sandbox.
mkdir -p "$(dirname "${SPEC_AUDIT_CONTEXT_FILE}")"
jq -n --arg repo "${REPO_FULL_NAME}" --argjson pr_number "${PR_NUMBER}" \
  --arg head_sha "${head_sha}" \
  '{repo: $repo, pr_number: $pr_number, head_sha: $head_sha}' \
  > "${SPEC_AUDIT_CONTEXT_FILE}"
echo "Prepared audit checkout at ${head_sha}"
