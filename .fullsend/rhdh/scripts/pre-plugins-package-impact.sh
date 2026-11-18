#!/usr/bin/env bash
# Pre-script: resolve issue/PR, workspace, and Dependabot alerts snapshot.
# Runs on the trusted runner before the sandbox starts. Writes the raw
# GitHub list-alerts JSON for --alerts-json (no token in the sandbox).
#
# Dependabot alerts (priority order):
#   1. CVE schedule — plan job uploads cve-schedule-alerts/<workspace>.json;
#      pre-script downloads that file for this workspace only.
#   2. Legacy — dependabot_alerts embedded in event-payload.json (deprecated).
#   3. Fallback — DEPENDABOT_TOKEN or GH_TOKEN API fetch (local / legacy).
#
# Tokens:
#   REVIEW_TOKEN / GH_TOKEN — issue/PR metadata and commenting (minted)
set -euo pipefail

WORKSPACE_DIR="/tmp/workspace"
mkdir -p "${WORKSPACE_DIR}"

_TOKEN="${REVIEW_TOKEN:-${GH_TOKEN:-}}"
if [[ -n "${_TOKEN}" ]]; then
  echo "::add-mask::${_TOKEN}"
  export GH_TOKEN="${_TOKEN}"
fi

if [[ -n "${DEPENDABOT_TOKEN:-}" ]]; then
  echo "::add-mask::${DEPENDABOT_TOKEN}"
fi

EVENT_FILE=".fullsend/dispatch/event-payload.json"

ISSUE_URL="${ISSUE_URL:-${GITHUB_PR_URL:-${GITHUB_ISSUE_URL:-}}}"
REPO_FULL_NAME="${REPO_FULL_NAME:-}"
ISSUE_NUMBER="${ISSUE_NUMBER:-${PR_NUMBER:-}}"
HUMAN_INSTRUCTION="${HUMAN_INSTRUCTION:-}"

if [[ -f "${EVENT_FILE}" ]]; then
  if [[ -z "${REPO_FULL_NAME}" ]]; then
    REPO_FULL_NAME="$(jq -r '.repository.full_name // empty' "${EVENT_FILE}")"
  fi
  if [[ -z "${ISSUE_NUMBER}" ]]; then
    ISSUE_NUMBER="$(jq -r '.issue.number // .pull_request.number // empty' "${EVENT_FILE}")"
  fi
  if [[ -z "${ISSUE_URL}" ]]; then
    ISSUE_URL="$(jq -r '.issue.html_url // .pull_request.html_url // empty' "${EVENT_FILE}")"
  fi
  if [[ -z "${HUMAN_INSTRUCTION}" || "${HUMAN_INSTRUCTION}" == "none" ]]; then
    FROM_PAYLOAD="$(jq -r '
      .transition.comment.instruction
      // ._normalized_event.transition.comment.instruction
      // .comment.body
      // empty
    ' "${EVENT_FILE}" 2>/dev/null || true)"
    if [[ -n "${FROM_PAYLOAD}" ]]; then
      HUMAN_INSTRUCTION="$(printf '%s' "${FROM_PAYLOAD}" \
        | sed -E 's|^[[:space:]]*/fullsend-package-impact[[:space:]]*||' \
        | sed -E 's|^[[:space:]]*cve-bump[[:space:]]*||' \
        | sed -E 's|^[[:space:]]+||; s|[[:space:]]+$||')"
    fi
  fi
fi

if [[ "${HUMAN_INSTRUCTION}" == "none" ]]; then
  HUMAN_INSTRUCTION=""
fi
HUMAN_INSTRUCTION="$(printf '%s' "${HUMAN_INSTRUCTION}" | tr '\n' ' ' | sed -E 's/[[:space:]]+/ /g; s/^ //; s/ $//')"

if [[ -z "${ISSUE_URL}" && -n "${REPO_FULL_NAME}" && -n "${ISSUE_NUMBER}" ]]; then
  ISSUE_URL="https://github.com/${REPO_FULL_NAME}/issues/${ISSUE_NUMBER}"
fi

if [[ -z "${ISSUE_URL}" ]]; then
  echo "::error::ISSUE_URL (or ISSUE_NUMBER+REPO_FULL_NAME) is required"
  exit 1
fi

if [[ "${ISSUE_URL}" =~ ^https://github\.com/([A-Za-z0-9._-]+/[A-Za-z0-9._-]+)/(pull|issues)/([0-9]+)([?#].*)?$ ]]; then
  URL_REPO="${BASH_REMATCH[1]}"
  URL_NUMBER="${BASH_REMATCH[3]}"
else
  echo "::error::ISSUE_URL is not a GitHub issue or pull request URL: ${ISSUE_URL}"
  exit 1
fi

if [[ -z "${REPO_FULL_NAME}" ]]; then
  REPO_FULL_NAME="${URL_REPO}"
elif [[ "${REPO_FULL_NAME}" != "${URL_REPO}" ]]; then
  echo "::error::REPO_FULL_NAME (${REPO_FULL_NAME}) does not match URL repo (${URL_REPO})"
  exit 1
fi

if [[ -z "${ISSUE_NUMBER}" ]]; then
  ISSUE_NUMBER="${URL_NUMBER}"
elif [[ "${ISSUE_NUMBER}" != "${URL_NUMBER}" ]]; then
  echo "::error::ISSUE_NUMBER (${ISSUE_NUMBER}) does not match URL number (${URL_NUMBER})"
  exit 1
fi

if [[ ! "${ISSUE_NUMBER}" =~ ^[1-9][0-9]*$ ]]; then
  echo "::error::ISSUE_NUMBER must be a positive integer, got: '${ISSUE_NUMBER}'"
  exit 1
fi

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "::error::GH_TOKEN or REVIEW_TOKEN is required"
  exit 1
fi

normalize_workspace() {
  local raw="${1:-}"
  raw="${raw#workspaces/}"
  raw="${raw%/yarn.lock}"
  raw="${raw%/package.json}"
  raw="${raw%/}"
  if [[ "${raw}" =~ ^[A-Za-z0-9._-]+$ ]]; then
    printf '%s' "${raw}"
  fi
}

WS=""
PACKAGES_FROM_COMMENT=()
if [[ -n "${HUMAN_INSTRUCTION}" ]]; then
  # shellcheck disable=SC2086
  set -- ${HUMAN_INSTRUCTION}
  if [[ $# -gt 0 ]]; then
    WS="$(normalize_workspace "$1" || true)"
    shift || true
    while [[ $# -gt 0 ]]; do
      PACKAGES_FROM_COMMENT+=("$1")
      shift
    done
  fi
fi

ISSUE_JSON="$(gh issue view "${ISSUE_NUMBER}" --repo "${REPO_FULL_NAME}" \
  --json number,url,title,labels,pullRequest 2>/dev/null || true)"
IS_PR="false"
if [[ -n "${ISSUE_JSON}" ]]; then
  if [[ "$(jq -r '.pullRequest != null' <<<"${ISSUE_JSON}")" == "true" ]]; then
    IS_PR="true"
  fi
  if [[ -z "${WS}" ]]; then
    mapfile -t LABEL_WS < <(jq -r '.labels[].name // empty' <<<"${ISSUE_JSON}" \
      | sed -n 's|^workspace/||p')
    if [[ ${#LABEL_WS[@]} -eq 1 ]]; then
      WS="$(normalize_workspace "${LABEL_WS[0]}")"
    fi
  fi
fi

if [[ -z "${WS}" && "${IS_PR}" == "true" ]]; then
  mapfile -t FILE_WS < <(gh pr view "${ISSUE_NUMBER}" --repo "${REPO_FULL_NAME}" \
    --json files --jq '.files[].path' \
    | sed -n 's|^workspaces/\([^/]*\)/.*|\1|p' | sort -u)
  if [[ ${#FILE_WS[@]} -eq 1 ]]; then
    WS="$(normalize_workspace "${FILE_WS[0]}")"
  fi
fi

CHECKOUT=""
for candidate in target-repo .; do
  if [[ -n "${WS}" && -f "${candidate}/workspaces/${WS}/yarn.lock" ]]; then
    CHECKOUT="${candidate}"
    break
  fi
done

load_alerts_from_artifact() {
  local ws="$1"
  local run_id artifact dest_dir file
  if [[ ! -f "${EVENT_FILE}" ]]; then
    return 1
  fi
  run_id="$(jq -r '.cve_schedule.alerts_run_id // empty' "${EVENT_FILE}" 2>/dev/null || true)"
  artifact="$(jq -r '.cve_schedule.alerts_artifact // "cve-schedule-alerts"' "${EVENT_FILE}" 2>/dev/null || true)"
  if [[ -z "${run_id}" || -z "${ws}" || ! "${ws}" =~ ^[A-Za-z0-9._-]+$ ]]; then
    return 1
  fi
  if [[ -z "${REPO_FULL_NAME}" || -z "${GH_TOKEN:-}" ]]; then
    return 1
  fi
  dest_dir="$(mktemp -d)"
  if ! gh run download "${run_id}" --repo "${REPO_FULL_NAME}" \
    --name "${artifact}" --dir "${dest_dir}" 2>/dev/null; then
    rm -rf "${dest_dir}"
    return 1
  fi
  for file in "${dest_dir}/${ws}.json" "${dest_dir}/cve-schedule-alerts/${ws}.json"; do
    if [[ -f "${file}" ]]; then
      jq -c '.' "${file}" > "${WORKSPACE_DIR}/dependabot-alerts.json"
      rm -rf "${dest_dir}"
      return 0
    fi
  done
  rm -rf "${dest_dir}"
  return 1
}

DEPENDABOT_STATUS="skipped"
DEPENDABOT_SOURCE="none"
printf '%s\n' '[]' > "${WORKSPACE_DIR}/dependabot-alerts.json"
if [[ -n "${WS}" ]]; then
  if load_alerts_from_artifact "${WS}"; then
    DEPENDABOT_STATUS="embedded"
    DEPENDABOT_SOURCE="artifact"
  elif [[ -f "${EVENT_FILE}" ]] \
    && jq -e '.dependabot_alerts | type == "array"' "${EVENT_FILE}" >/dev/null 2>&1; then
    jq -c '.dependabot_alerts' "${EVENT_FILE}" > "${WORKSPACE_DIR}/dependabot-alerts.json"
    DEPENDABOT_STATUS="embedded"
    DEPENDABOT_SOURCE="embedded"
  else
    # Fallback: API fetch (local testing; not used by CVE schedule).
    _ALERT_TOKEN="${DEPENDABOT_TOKEN:-${GH_TOKEN:-}}"
    if [[ -z "${_ALERT_TOKEN}" ]]; then
      DEPENDABOT_STATUS="missing_token"
      echo "::warning::No CVE schedule alert artifact, embedded dependabot_alerts, or DEPENDABOT_TOKEN/GH_TOKEN for API fetch."
    else
      ERRFILE="$(mktemp)"
      if ALERTS_RAW="$(GH_TOKEN="${_ALERT_TOKEN}" gh api --paginate \
        "repos/${REPO_FULL_NAME}/dependabot/alerts?state=open" 2>"${ERRFILE}")"; then
        jq -c '
          if type == "array" then
            if length == 0 then []
            elif (.[0] | type) == "array" then add
            else .
            end
          else []
          end
        ' <<<"${ALERTS_RAW}" > "${WORKSPACE_DIR}/dependabot-alerts.json"
        DEPENDABOT_STATUS="ok"
        DEPENDABOT_SOURCE="api"
      else
        DEPENDABOT_STATUS="forbidden"
        echo "::warning::Dependabot alerts fetch failed: $(tr '\n' ' ' < "${ERRFILE}")"
      fi
      rm -f "${ERRFILE}"
    fi
  fi
fi

PREFIX=""
if [[ -n "${WS}" ]]; then
  PREFIX="workspaces/${WS}/"
fi
PACKAGES_FROM_ALERTS="$(jq -c --arg prefix "${PREFIX}" '
  (if type == "array" then . else [] end) as $alerts
  | if $prefix == "" then []
    else
      [$alerts[] | select((.dependency.manifest_path // "") | startswith($prefix))
        | .dependency.package.name // empty]
      | unique | sort
    end
' "${WORKSPACE_DIR}/dependabot-alerts.json")"
ALERT_COUNT="$(jq -c --arg prefix "${PREFIX}" '
  (if type == "array" then . else [] end) as $alerts
  | if $prefix == "" then 0
    else
      [$alerts[] | select((.dependency.manifest_path // "") | startswith($prefix))] | length
    end
' "${WORKSPACE_DIR}/dependabot-alerts.json")"

CONTEXT_JSON="$(jq -n \
  --arg repo "${REPO_FULL_NAME}" \
  --argjson number "${ISSUE_NUMBER}" \
  --arg url "${ISSUE_URL}" \
  --argjson is_pr "${IS_PR}" \
  --arg workspace "${WS}" \
  --arg dependabot_fetch "${DEPENDABOT_STATUS}" \
  --arg dependabot_source "${DEPENDABOT_SOURCE}" \
  --arg checkout "${CHECKOUT}" \
  --arg instruction "${HUMAN_INSTRUCTION}" \
  --arg alerts_json "/sandbox/workspace/dependabot-alerts.json" \
  --argjson comment_packages "$(printf '%s\n' "${PACKAGES_FROM_COMMENT[@]+"${PACKAGES_FROM_COMMENT[@]}"}" | jq -R . | jq -s -c 'map(select(length > 0))')" \
  --argjson packages_from_alerts "${PACKAGES_FROM_ALERTS}" \
  --argjson alert_count "${ALERT_COUNT}" \
  '{
    repo: $repo,
    issue_number: $number,
    issue_url: $url,
    is_pull_request: $is_pr,
    workspace: (if $workspace == "" then null else $workspace end),
    dependabot_fetch: $dependabot_fetch,
    dependabot_source: $dependabot_source,
    checkout: $checkout,
    human_instruction: $instruction,
    alerts_json: $alerts_json,
    packages_from_comment: $comment_packages,
    packages: ((if ($comment_packages | length) > 0 then $comment_packages else $packages_from_alerts end)),
    alert_count: $alert_count
  }')"

printf '%s\n' "${CONTEXT_JSON}" > "${WORKSPACE_DIR}/package-impact-context.json"

if [[ -n "${GITHUB_ENV:-}" ]]; then
  {
    echo "ISSUE_URL=${ISSUE_URL}"
    echo "GITHUB_ISSUE_URL=${ISSUE_URL}"
    echo "REPO_FULL_NAME=${REPO_FULL_NAME}"
    echo "ISSUE_NUMBER=${ISSUE_NUMBER}"
    echo "PR_NUMBER=${ISSUE_NUMBER}"
    echo "PACKAGE_IMPACT_WORKSPACE=${WS}"
    echo "HUMAN_INSTRUCTION=${HUMAN_INSTRUCTION}"
  } >> "${GITHUB_ENV}"
fi

echo "::notice::package-impact target=${ISSUE_URL} workspace=${WS:-unset} dependabot=${DEPENDABOT_STATUS} source=${DEPENDABOT_SOURCE}"
echo "ISSUE_URL=${ISSUE_URL}"
echo "REPO_FULL_NAME=${REPO_FULL_NAME}"
echo "WORKSPACE=${WS}"
