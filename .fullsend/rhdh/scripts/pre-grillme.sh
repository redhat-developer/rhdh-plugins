#!/usr/bin/env bash
# pre-grillme.sh — Validate grillme inputs and enrich context before the sandbox.
#
# Runs on the trusted runner via the harness pre_script.
#
# Accepts either workflow-exported env vars or the BYOA dispatch event payload
# at .fullsend/dispatch/event-payload.json. 0.39 reusable-dispatch writes a
# NormalizedEvent (`.repo`, `.entity.url`, `.entity.id`); GitHub-shaped
# payloads from older shims still work as fallbacks.

set -euo pipefail

EVENT_FILE=".fullsend/dispatch/event-payload.json"

payload_get() {
  local query="$1"
  if [[ -f "${EVENT_FILE}" ]]; then
    jq -r "${query}" "${EVENT_FILE}" 2>/dev/null || true
  fi
}

# ---------------------------------------------------------------------------
# Derive missing context from the dispatch event payload (BYOA path)
# ---------------------------------------------------------------------------
if [[ -f "${EVENT_FILE}" ]]; then
  echo "Reading dispatch event payload from ${EVENT_FILE}"

  if [[ -z "${REPO_FULL_NAME:-}" ]]; then
    REPO_FULL_NAME="$(payload_get '.repo // .repository.full_name // empty')"
  fi

  if [[ -z "${ISSUE_NUMBER:-}" && -z "${PR_NUMBER:-}" ]]; then
    ISSUE_NUMBER="$(payload_get '.issue.number // .pull_request.number // .entity.id // .entity.key // empty')"
  fi

  if [[ -z "${GITHUB_ISSUE_URL:-}" ]]; then
    GITHUB_ISSUE_URL="$(payload_get '.entity.url // .issue.html_url // .pull_request.html_url // empty')"
  fi

  if [[ -z "${HUMAN_INSTRUCTION:-}" || "${HUMAN_INSTRUCTION}" == "none" ]]; then
    FROM_PAYLOAD="$(payload_get '
      .transition.comment.instruction
      // .comment.body
      // .issue_comment.body
      // empty
    ')"
    if [[ -n "${FROM_PAYLOAD}" && "${FROM_PAYLOAD}" != "null" ]]; then
      # Remove leading /fs-grillme and trim.
      HUMAN_INSTRUCTION="$(printf '%s' "${FROM_PAYLOAD}" \
        | sed -E 's|^[[:space:]]*/fs-grillme[[:space:]]*||' \
        | sed -E 's|^[[:space:]]+||; s|[[:space:]]+$||')"
    fi
  fi

  if [[ -z "${TRIGGER_SOURCE:-}" ]]; then
    TRIGGER_SOURCE="$(payload_get '.comment.user.login // .sender.login // .actor.login // empty')"
  fi
fi

# Normalize PR_NUMBER / ISSUE_NUMBER (GitHub PR comments use issue number == PR number).
if [[ -z "${PR_NUMBER:-}" && -n "${ISSUE_NUMBER:-}" ]]; then
  PR_NUMBER="${ISSUE_NUMBER}"
fi
if [[ -z "${ISSUE_NUMBER:-}" && -n "${PR_NUMBER:-}" ]]; then
  ISSUE_NUMBER="${PR_NUMBER}"
fi
if [[ -z "${ISSUE_NUMBER:-}" && -n "${GITHUB_ISSUE_URL:-}" ]]; then
  ISSUE_NUMBER="$(basename "${GITHUB_ISSUE_URL}")"
  PR_NUMBER="${ISSUE_NUMBER}"
fi

# ---------------------------------------------------------------------------
# Validate
# ---------------------------------------------------------------------------
errors=0

if [[ ! "${ISSUE_NUMBER:-}" =~ ^[1-9][0-9]*$ ]]; then
  echo "::error::ISSUE_NUMBER/PR_NUMBER must be a positive integer, got: '${ISSUE_NUMBER:-}'"
  errors=$((errors + 1))
fi

if [[ ! "${REPO_FULL_NAME:-}" =~ ^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$ ]]; then
  echo "::error::REPO_FULL_NAME must be owner/repo format, got: '${REPO_FULL_NAME:-}'"
  errors=$((errors + 1))
fi

if [[ "${errors}" -gt 0 ]]; then
  echo "::error::Input validation failed with ${errors} error(s). Aborting."
  exit 1
fi

# Cap human instruction length (defense against oversized comment input).
MAX_INSTRUCTION_BYTES=10000
if [[ -n "${HUMAN_INSTRUCTION:-}" && "${HUMAN_INSTRUCTION}" != "none" ]]; then
  INSTRUCTION_LEN="${#HUMAN_INSTRUCTION}"
  if [[ "${INSTRUCTION_LEN}" -gt "${MAX_INSTRUCTION_BYTES}" ]]; then
    echo "::error::HUMAN_INSTRUCTION is ${INSTRUCTION_LEN} bytes (max: ${MAX_INSTRUCTION_BYTES})."
    exit 1
  fi
fi

# Persist derived values for subsequent harness steps / host_files expand.
if [[ -n "${GITHUB_ENV:-}" ]]; then
  {
    echo "ISSUE_NUMBER=${ISSUE_NUMBER}"
    echo "PR_NUMBER=${PR_NUMBER}"
    echo "REPO_FULL_NAME=${REPO_FULL_NAME}"
    if [[ -n "${GITHUB_ISSUE_URL:-}" ]]; then
      echo "GITHUB_ISSUE_URL=${GITHUB_ISSUE_URL}"
    fi
    if [[ -n "${TRIGGER_SOURCE:-}" ]]; then
      echo "TRIGGER_SOURCE=${TRIGGER_SOURCE}"
    fi
  } >> "${GITHUB_ENV}"

  if [[ -n "${HUMAN_INSTRUCTION:-}" ]]; then
    DELIM="GRILLME_INSTR_$(openssl rand -hex 8)"
    {
      echo "HUMAN_INSTRUCTION<<${DELIM}"
      printf '%s\n' "${HUMAN_INSTRUCTION}"
      echo "${DELIM}"
    } >> "${GITHUB_ENV}"
  fi
fi

echo "Grillme pre-check passed:"
echo "  REPO_FULL_NAME=${REPO_FULL_NAME}"
echo "  ISSUE_NUMBER=${ISSUE_NUMBER}"
echo "  PR_NUMBER=${PR_NUMBER}"
echo "  TRIGGER_SOURCE=${TRIGGER_SOURCE:-}"
if [[ -n "${HUMAN_INSTRUCTION:-}" && "${HUMAN_INSTRUCTION}" != "none" ]]; then
  echo "  HUMAN_INSTRUCTION=${HUMAN_INSTRUCTION:0:200}"
else
  echo "  HUMAN_INSTRUCTION=<empty>"
fi

# ---------------------------------------------------------------------------
# Optional: skip closed/merged PRs
# ---------------------------------------------------------------------------
_TOKEN="${REVIEW_TOKEN:-${GH_TOKEN:-}}"
if [[ -z "${_TOKEN}" ]]; then
  echo "No token available — skipping PR state check"
  exit 0
fi

PR_STATE="$(GH_TOKEN="${_TOKEN}" gh pr view "${PR_NUMBER}" \
  --repo "${REPO_FULL_NAME}" --json state --jq '.state' 2>/dev/null || true)"

if [[ -n "${PR_STATE}" && "${PR_STATE}" != "OPEN" ]]; then
  echo "::notice::PR #${PR_NUMBER} is ${PR_STATE} — skipping grillme"

  STATE_LOWER="$(echo "${PR_STATE}" | tr '[:upper:]' '[:lower:]')"
  COMMENT_BODY="Grillme skipped — this PR is already **${STATE_LOWER}**.

The \`/fs-grillme\` command only runs on open pull requests.

<!-- fullsend:grillme -->
<sub>Posted by fullsend pre-grillme check</sub>"

  printf '%s' "${COMMENT_BODY}" | GH_TOKEN="${_TOKEN}" gh issue comment "${ISSUE_NUMBER}" \
    --repo "${REPO_FULL_NAME}" --body-file - 2>/dev/null || true

  # Abort before sandbox start — skip comment already posted.
  exit 1
fi

echo "PR #${PR_NUMBER} is open — proceeding with grillme agent"
