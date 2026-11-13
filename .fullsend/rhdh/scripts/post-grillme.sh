#!/usr/bin/env bash
# post-grillme.sh — Execute grillme agent actions on a PR.
#
# Runs on the trusted runner AFTER the sandbox is destroyed.
#
# The agent outputs a markdown body (PR review body) and a JSON action block.
# This script parses both and executes three types of actions:
#
#   1. Post a PR review with inline comments (new_comments)
#   2. Reply to existing review comment threads (thread_replies)
#   3. Resolve review threads via GraphQL (resolve_threads)
#
# SECURITY: Agent output is untrusted. We:
#   - Extract text via jq (no shell eval of agent strings)
#   - Truncate to a safe length (prevent comment-bomb)
#   - Post via --input - / --body-file - (no shell interpolation)
#   - Validate ISSUE_NUMBER is numeric
#   - Validate REPO_FULL_NAME matches owner/repo pattern

set -euo pipefail

# ---------- Auth ----------

_TOKEN="${REVIEW_TOKEN:-${GH_TOKEN:-}}"
if [[ -z "${_TOKEN}" ]]; then
  echo "::error::REVIEW_TOKEN or GH_TOKEN is required"
  exit 1
fi
echo "::add-mask::${_TOKEN}"
export GH_TOKEN="${_TOKEN}"
RUN_URL="${RUN_URL:-${STATUS_RUN_URL:-}}"

# ---------- Derive ISSUE_NUMBER ----------
# The pre-script writes to GITHUB_ENV, but the harness runner executes
# pre-script → sandbox → post-script within a single GHA step, so
# GITHUB_ENV changes don't propagate.

ISSUE_NUMBER="${ISSUE_NUMBER:-${PR_NUMBER:-}}"
if [[ -z "${ISSUE_NUMBER}" && -n "${GITHUB_ISSUE_URL:-}" ]]; then
  ISSUE_NUMBER="$(basename "${GITHUB_ISSUE_URL}")"
fi
if [[ ! "${ISSUE_NUMBER}" =~ ^[0-9]+$ ]]; then
  echo "::error::ISSUE_NUMBER/PR_NUMBER must be numeric, got: '${ISSUE_NUMBER:-}'"
  exit 1
fi

if [[ ! "${REPO_FULL_NAME:-}" =~ ^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$ ]]; then
  echo "::error::REPO_FULL_NAME is not set or invalid: '${REPO_FULL_NAME:-}'"
  exit 1
fi

# ---------- Find the output file ----------

OUTPUT_FILE=""
if [[ -n "${FULLSEND_VALIDATED_ITERATION_DIR:-}" && -f "${FULLSEND_VALIDATED_ITERATION_DIR}/output.jsonl" ]]; then
  OUTPUT_FILE="${FULLSEND_VALIDATED_ITERATION_DIR}/output.jsonl"
else
  for dir in iteration-*/; do
    if [[ -f "${dir}/output.jsonl" ]]; then
      OUTPUT_FILE="${dir}/output.jsonl"
    fi
  done
fi

if [[ -z "${OUTPUT_FILE}" ]]; then
  echo "WARNING: output.jsonl not found — agent may have crashed before producing output"
  BODY="<!-- fullsend:grillme -->
## Grillme

⚠️ Grillme agent produced no output. Check the [workflow run](${RUN_URL:-}) for logs.

---
<sub>Posted by grillme agent · [Run logs](${RUN_URL:-})</sub>"
  printf '%s' "${BODY}" | gh issue comment "${ISSUE_NUMBER}" --repo "${REPO_FULL_NAME}" --body-file -
  exit 0
fi

echo "Reading agent output from: ${OUTPUT_FILE}"

# ---------- Extract the last assistant text block ----------

SUMMARY=$(jq -s -r '
  [ .[]
    | select(.type == "assistant")
    | .message.content[]?
    | select(.type == "text")
    | .text
  ]
  | if length == 0 then empty else .[-1] end
' "${OUTPUT_FILE}")

if [[ -z "${SUMMARY}" ]]; then
  echo "WARNING: No assistant text found in output.jsonl"
  SUMMARY="⚠️ Grillme agent ran but produced no text output."
fi

SUMMARY="${SUMMARY:0:60000}"

# ---------- Split markdown body and JSON action block ----------

ACTION_JSON=""
MARKDOWN_BODY="${SUMMARY}"

if printf '%s' "${SUMMARY}" | grep -qE '```json:grillme'; then
  ACTION_JSON=$(printf '%s' "${SUMMARY}" | awk '
    /^```json:grillme/ { capture=1; next }
    capture && /^```/ { capture=0; next }
    capture { print }
  ')
  MARKDOWN_BODY=$(printf '%s' "${SUMMARY}" | awk '
    /^```json:grillme/ { skip=1; next }
    skip && /^```/ { skip=0; next }
    skip { next }
    { print }
  ')
  MARKDOWN_BODY=$(printf '%s' "${MARKDOWN_BODY}" | sed -e 's/[[:space:]]*$//')
fi

# Drop chain-of-thought preamble. The review body starts at the Grillme heading.
if printf '%s' "${MARKDOWN_BODY}" | grep -qE '^#{1,3}[[:space:]]+.*Grillme'; then
  MARKDOWN_BODY=$(printf '%s' "${MARKDOWN_BODY}" | awk '
    /^#{1,3}[[:space:]]+.*Grillme/ { keep=1 }
    keep { print }
  ')
fi

# ---------- Determine footer ----------

is_session_complete=false
if printf '%s' "${MARKDOWN_BODY}" | grep -qiE 'session complete'; then
  is_session_complete=true
fi

if [[ "${is_session_complete}" == "true" ]]; then
  FOOTER="<sub>Start a new session with <code>/fs-grillme</code> · [Run logs](${RUN_URL:-})</sub>"
else
  FOOTER="<sub>Reply to inline comments, then run <code>/fs-grillme</code> to continue · [Run logs](${RUN_URL:-})</sub>"
fi

REVIEW_BODY="<!-- fullsend:grillme -->
${MARKDOWN_BODY}

---
${FOOTER}"

# ---------- Action: Post PR review with new inline comments ----------

has_new_comments=false
if [[ -n "${ACTION_JSON}" ]] && printf '%s' "${ACTION_JSON}" | jq -e '.new_comments | length > 0' >/dev/null 2>&1; then
  has_new_comments=true
fi

if [[ "${has_new_comments}" == "true" ]]; then
  review_payload=$(printf '%s' "${ACTION_JSON}" | jq -c --arg body "${REVIEW_BODY}" '{
    event: "COMMENT",
    body: $body,
    comments: [
      .new_comments[] | {
        path: .path,
        line: .line,
        body: .body
      }
    ]
  }')

  if printf '%s' "${review_payload}" \
    | gh api "repos/${REPO_FULL_NAME}/pulls/${ISSUE_NUMBER}/reviews" \
        --method POST --input -; then
    comment_count=$(printf '%s' "${ACTION_JSON}" | jq '.new_comments | length')
    echo "PR review posted with ${comment_count} inline comment(s)"
  else
    echo "WARNING: Failed to post PR review with inline comments — falling back to issue comment"
    FALLBACK="${REVIEW_BODY}

⚠️ Inline comments were not pinned — GitHub rejected the paths/lines (they may not be in this PR's diff)."
    printf '%s' "${FALLBACK}" | gh issue comment "${ISSUE_NUMBER}" --repo "${REPO_FULL_NAME}" --body-file -
  fi
else
  printf '%s' "${REVIEW_BODY}" | gh issue comment "${ISSUE_NUMBER}" --repo "${REPO_FULL_NAME}" --body-file -
  echo "Review body posted as PR comment (no new inline comments)"
fi

# ---------- Action: Reply to existing review threads ----------

if [[ -n "${ACTION_JSON}" ]] && printf '%s' "${ACTION_JSON}" | jq -e '.thread_replies | length > 0' >/dev/null 2>&1; then
  printf '%s' "${ACTION_JSON}" | jq -c '.thread_replies[]' | while IFS= read -r reply; do
    comment_id=$(printf '%s' "${reply}" | jq -r '.comment_id')

    if [[ -z "${comment_id}" || "${comment_id}" == "null" ]]; then
      echo "WARNING: Skipping reply with missing comment_id"
      continue
    fi

    if printf '%s' "${reply}" | jq -c '{body: .body}' \
      | gh api "repos/${REPO_FULL_NAME}/pulls/${ISSUE_NUMBER}/comments/${comment_id}/replies" \
          --method POST --input -; then
      echo "Replied to review comment ${comment_id}"
    else
      echo "WARNING: Failed to reply to comment ${comment_id}"
    fi
  done
fi

# ---------- Action: Resolve review threads (GraphQL) ----------

if [[ -n "${ACTION_JSON}" ]] && printf '%s' "${ACTION_JSON}" | jq -e '.resolve_threads | length > 0' >/dev/null 2>&1; then
  printf '%s' "${ACTION_JSON}" | jq -r '.resolve_threads[]' | while IFS= read -r thread_id; do
    if [[ -z "${thread_id}" || "${thread_id}" == "null" ]]; then
      echo "WARNING: Skipping empty thread ID"
      continue
    fi

    # GraphQL variables must remain literal for gh to bind them.
    # shellcheck disable=SC2016
    if gh api graphql -f query='
      mutation($threadId: ID!) {
        resolveReviewThread(input: {threadId: $threadId}) {
          thread { id isResolved }
        }
      }
    ' -f threadId="${thread_id}"; then
      echo "Resolved thread ${thread_id}"
    else
      echo "WARNING: Failed to resolve thread ${thread_id}"
    fi
  done
fi

echo "Grillme turn complete on ${REPO_FULL_NAME}#${ISSUE_NUMBER}"
