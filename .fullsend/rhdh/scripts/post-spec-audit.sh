#!/usr/bin/env bash
# Publish only the dedicated audit comment. Do not use post-review: it
# replaces code-review comments, dismisses reviews, and changes labels.
set -euo pipefail

: "${REVIEW_TOKEN:?REVIEW_TOKEN is required}"
: "${SPEC_AUDIT_CONTEXT_FILE:?SPEC_AUDIT_CONTEXT_FILE is required}"
: "${FULLSEND_VALIDATED_ITERATION_DIR:?A validated audit result is required}"
export GH_TOKEN="${REVIEW_TOKEN}"

if [[ ! "${REPO_FULL_NAME:-}" =~ ^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$ ]] \
  || [[ ! "${PR_NUMBER:-}" =~ ^[1-9][0-9]*$ ]]; then
  echo "::error::Invalid audit repository or PR number" >&2
  exit 1
fi

head_sha=$(jq -er --arg repo "${REPO_FULL_NAME}" --argjson pr "${PR_NUMBER}" '
  select(.repo == $repo and .pr_number == $pr)
  | .head_sha | select(test("^[0-9a-f]{40}$"))
' "${SPEC_AUDIT_CONTEXT_FILE}")
result="${FULLSEND_VALIDATED_ITERATION_DIR}/agent-result.json"

# Enforce comment-only output again on the runner, including identity and
# the exact snapshot. Extra review actions are never forwarded to a publisher.
jq -e --arg repo "${REPO_FULL_NAME}" --argjson pr "${PR_NUMBER}" \
  --arg sha "${head_sha}" '
  type == "object"
  and ((keys - ["action", "body", "head_sha", "pr_number", "reason", "repo"]) | length == 0)
  and (.action == "comment" or .action == "failure")
  and .repo == $repo and .pr_number == $pr and .head_sha == $sha
  and (.body | type == "string" and test("\\S"))
  and (if .action == "failure" then
    (.reason == "missing-context" or .reason == "tool-failure"
      or .reason == "ambiguous-findings" or .reason == "token-limit")
    else true end)
' "${result}" > /dev/null

metadata=$(gh pr view "${PR_NUMBER}" --repo "${REPO_FULL_NAME}" \
  --json state,headRefOid)
state=$(jq -er '.state' <<< "${metadata}")
if [[ "${state}" == "CLOSED" || "${state}" == "MERGED" ]]; then
  echo "PR is closed or merged; skipping the audit comment"
  exit 0
fi
if [[ "${state}" != "OPEN" ]]; then
  echo "::error::Could not verify that the audit PR is open" >&2
  exit 1
fi
current_sha=$(jq -er '.headRefOid | select(test("^[0-9a-f]{40}$"))' <<< "${metadata}")
body=$(mktemp)
trap 'rm -f "${body}"' EXIT

if [[ "${current_sha}" != "${head_sha}" ]]; then
  # Keep Markdown backticks literal in the printf format.
  # shellcheck disable=SC2016
  printf '## OpenSpec audit\n\nAudit is stale: the PR changed after snapshot `%s`.\n\nRun `/fs-spec audit [change-name]` again. No current audit outcome is available.\n' \
    "${head_sha}" > "${body}"
else
  # shellcheck disable=SC2016
  printf '## OpenSpec audit\n\nAudit snapshot: `%s`\n\n' "${head_sha}" > "${body}"
  jq -r '.body' "${result}" >> "${body}"
fi

# Use the GitHub marker-aware publisher, preserving the source command's
# comment ownership checks. It only creates/updates our comment and never
# submits/dismisses formal reviews, mutates labels, or triggers /fs-fix.
fullsend post-comment --repo "${REPO_FULL_NAME}" --token "${REVIEW_TOKEN}" \
  --number "${PR_NUMBER}" --marker '<!-- fullsend:spec-audit -->' \
  --result "${body}"
