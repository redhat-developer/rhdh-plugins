#!/usr/bin/env bash
set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN is required}"
: "${REPO_FULL_NAME:?REPO_FULL_NAME is required}"
: "${GITHUB_ISSUE_URL:?GITHUB_ISSUE_URL is required}"
: "${CI_CONTEXT_FILE:?CI_CONTEXT_FILE is required}"
export GH_TOKEN
echo "::add-mask::${GH_TOKEN}"

GITLEAKS_VERSION="8.30.1"
GITLEAKS_SHA256="551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb"
tool_dir=""
scan_dir=""
comment_file=""

cleanup() {
  [[ -z "${tool_dir}" ]] || rm -rf -- "${tool_dir}"
  [[ -z "${scan_dir}" ]] || rm -rf -- "${scan_dir}"
  [[ -z "${comment_file}" ]] || rm -f -- "${comment_file}"
}
trap cleanup EXIT

install_gitleaks() {
  if command -v gitleaks >/dev/null 2>&1; then
    return
  fi
  tool_dir="$(mktemp -d)"
  curl -fsSL --proto '=https' \
    "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
    -o "${tool_dir}/gitleaks.tar.gz"
  echo "${GITLEAKS_SHA256}  ${tool_dir}/gitleaks.tar.gz" | sha256sum -c --quiet
  tar xzf "${tool_dir}/gitleaks.tar.gz" -C "${tool_dir}" gitleaks
  PATH="${tool_dir}:${PATH}"
  export PATH
}

one_line() {
  printf '%s' "${1:-}" | tr '\r\n' '  ' | sed 's/@/＠/g; s/`/ˋ/g; s/|/\\|/g; s/<!--/‹!--/g; s/-->/--›/g'
}

result_file=""
if [[ -n "${FULLSEND_VALIDATED_ITERATION_DIR:-}" ]]; then
  if [[ -f "${FULLSEND_VALIDATED_ITERATION_DIR}/output/agent-result.json" ]]; then
    result_file="${FULLSEND_VALIDATED_ITERATION_DIR}/output/agent-result.json"
  elif [[ -f "${FULLSEND_VALIDATED_ITERATION_DIR}/output/result.json" ]]; then
    result_file="${FULLSEND_VALIDATED_ITERATION_DIR}/output/result.json"
  fi
else
  shopt -s nullglob
  for output_dir in iteration-*/output; do
    if [[ -f "${output_dir}/agent-result.json" ]]; then
      result_file="${output_dir}/agent-result.json"
    elif [[ -f "${output_dir}/result.json" ]]; then
      result_file="${output_dir}/result.json"
    fi
  done
fi
[[ -n "${result_file}" && -f "${result_file}" ]] || { echo "::error::Validated triage result not found" >&2; exit 1; }
[[ -f "${CI_CONTEXT_FILE}" ]] || { echo "::error::Trusted CI context not found" >&2; exit 1; }
jq empty "${result_file}"
jq empty "${CI_CONTEXT_FILE}"

install_gitleaks
scan_dir="$(mktemp -d)"
cp "${result_file}" "${scan_dir}/agent-result.json"
gitleaks detect --source "${scan_dir}" --no-git --redact

pr_number="$(jq -r '.pr.number' "${result_file}")"
head_sha="$(jq -r '.pr.head_sha' "${result_file}")"
run_id="$(jq -r '.run.id' "${result_file}")"
run_attempt="$(jq -r '.run.attempt' "${result_file}")"
workspace="$(jq -r '.workspace_boundary.workspace // "none"' "${result_file}")"
category="$(jq -r '.category' "${result_file}")"
confidence="$(jq -r '.confidence' "${result_file}")"
recommendation="$(jq -r '.recommendation' "${result_file}")"

ctx_pr="$(jq -r '.pull_request.number' "${CI_CONTEXT_FILE}")"
ctx_head="$(jq -r '._fullsend_ci.head_sha' "${CI_CONTEXT_FILE}")"
ctx_run="$(jq -r '._fullsend_ci.run_id' "${CI_CONTEXT_FILE}")"
ctx_attempt="$(jq -r '._fullsend_ci.run_attempt' "${CI_CONTEXT_FILE}")"
ctx_workspace="$(jq -r '._fullsend_ci.workspace_scope.workspace // "none"' "${CI_CONTEXT_FILE}")"
ctx_mode="$(jq -r '._fullsend_ci.automation_mode' "${CI_CONTEXT_FILE}")"
mutation_eligible="$(jq -r '._fullsend_ci.trust.mutation_eligible == true' "${CI_CONTEXT_FILE}")"
same_repository="$(jq -r '._fullsend_ci.trust.same_repository == true' "${CI_CONTEXT_FILE}")"

[[ "${pr_number}" == "${ctx_pr}" && "${head_sha}" == "${ctx_head}" && "${run_id}" == "${ctx_run}" && "${run_attempt}" == "${ctx_attempt}" ]] || {
  echo "::error::Agent result identity does not match trusted dispatch context" >&2
  exit 1
}
[[ "${workspace}" == "${ctx_workspace}" ]] || {
  echo "::error::Agent changed the deterministic workspace boundary" >&2
  exit 1
}

current_pr="$(gh api "repos/${REPO_FULL_NAME}/pulls/${pr_number}")"
current_head="$(jq -r '.head.sha' <<<"${current_pr}")"
current_state="$(jq -r '.state' <<<"${current_pr}")"
current_no_fix="$(jq -r '.labels | any(.[]; .name == "fullsend-no-fix")' <<<"${current_pr}")"
stale="false"
if [[ "${current_state}" != "open" || "${current_head}" != "${head_sha}" ]]; then
  stale="true"
fi

marker="<!-- fullsend:ci-triage-result run=${run_id} attempt=${run_attempt} head=${head_sha} workspace=${workspace} category=${category} confidence=${confidence} recommendation=${recommendation} -->"
existing="$(gh api --paginate "repos/${REPO_FULL_NAME}/issues/${pr_number}/comments" --jq '.[].body' 2>/dev/null || true)"
if grep -Fq -- "${marker}" <<<"${existing}"; then
  echo "Triage result already posted"
else
  comment_file="$(mktemp)"
  {
    echo "${marker}"
    echo "### Fullsend CI diagnosis"
    echo
    echo "| Field | Result |"
    echo "|---|---|"
    echo "| Run | [${run_id} (attempt ${run_attempt})](https://github.com/${REPO_FULL_NAME}/actions/runs/${run_id}) |"
    echo "| Head | \`${head_sha:0:12}\` |"
    echo "| Workspace | \`${workspace}\` |"
    echo "| Category | \`${category}\` |"
    echo "| Confidence | \`${confidence}\` |"
    echo "| Recommendation | \`${recommendation}\` |"
    echo "| Automation | \`${ctx_mode}\` |"
    echo "| Stale result | \`${stale}\` |"
    echo
    echo "#### Root cause"
    echo
    echo "$(one_line "$(jq -r '.root_cause' "${result_file}")")"
    echo
    echo "#### Failed jobs and steps"
    jq -r '.failed_jobs[] | [.name, (.failed_steps | join(", "))] | @tsv' "${result_file}" | while IFS=$'\t' read -r job steps; do
      echo "- \`$(one_line "${job}")\`: $(one_line "${steps}")"
    done
    echo
    echo "#### Evidence"
    jq -r '.evidence[] | [.kind, .location, .summary] | @tsv' "${result_file}" | while IFS=$'\t' read -r kind location summary; do
      echo "- **$(one_line "${kind}")** — \`$(one_line "${location}")\`: $(one_line "${summary}")"
    done
    echo
    echo "#### Suggested verification"
    jq -r '.verification_commands[] | [.command, .reason] | @tsv' "${result_file}" | while IFS=$'\t' read -r command reason; do
      echo "- \`$(one_line "${command}")\` — $(one_line "${reason}")"
    done
    echo
    if [[ "${stale}" == "true" ]]; then
      echo "> The PR head changed before this result was posted. This diagnosis is retained for audit only; no action was dispatched."
    elif [[ "${ctx_mode}" == "observe" ]]; then
      echo "> Observe mode is active. No retry or repair was dispatched."
    elif [[ "${mutation_eligible}" != "true" ]]; then
      echo "> Trust and workspace gates make this PR diagnosis-only."
    fi
    echo
    echo "_Logs, artifacts, source, and test names were treated as untrusted evidence._"
  } >"${comment_file}"

  gh api "repos/${REPO_FULL_NAME}/issues/${pr_number}/comments" -f body="$(<"${comment_file}")" --silent
fi

ensure_label() {
  local name="$1" color="$2" description="$3"
  gh label create "${name}" --repo "${REPO_FULL_NAME}" --color "${color}" --description "${description}" --force >/dev/null
}
add_label() {
  local label="$1"
  gh api "repos/${REPO_FULL_NAME}/issues/${pr_number}/labels" -f "labels[]=${label}" --silent
}
cycle_ephemeral_label() {
  local name="$1" encoded
  encoded="$(printf '%s' "${name}" | jq -sRr @uri)"
  gh api "repos/${REPO_FULL_NAME}/issues/${pr_number}/labels/${encoded}" -X DELETE --silent >/dev/null 2>&1 || true
  add_label "${name}"
}

if [[ "${stale}" == "false" && "${ctx_mode}" == "repair" && "${same_repository}" == "true" && "${current_no_fix}" == "false" ]]; then
  if [[ "${recommendation}" == "needs_human" ]]; then
    ensure_label needs-human B60205 "Autonomous CI repair needs maintainer attention"
    add_label needs-human
  elif [[ "${mutation_eligible}" == "true" && "${recommendation}" == "repair" ]]; then
    dispatch_prefix="<!-- fullsend:ci-fix-dispatch run=${run_id} attempt=${run_attempt} head=${head_sha} "
    if ! grep -Fq -- "${dispatch_prefix}" <<<"${existing}"; then
      ensure_label fullsend-ci-fix 1D76DB "Ephemeral Fullsend CI repair dispatch"
      cycle_ephemeral_label fullsend-ci-fix
    fi
  elif [[ "${mutation_eligible}" == "true" && "${recommendation}" == "retry_once" ]]; then
    retry_marker="<!-- fullsend:ci-retry run=${run_id} attempt=${run_attempt} head=${head_sha} -->"
    if ! grep -Fq -- "${retry_marker}" <<<"${existing}"; then
      ensure_label fullsend-ci-retry D4C5F9 "Ephemeral Fullsend CI retry dispatch"
      cycle_ephemeral_label fullsend-ci-retry
    fi
  fi
fi

{
  echo "### Fullsend CI triage telemetry"
  echo "- category: ${category}"
  echo "- recommendation: ${recommendation}"
  echo "- run attempt: ${run_attempt}"
  echo "- stale: ${stale}"
} >>"${GITHUB_STEP_SUMMARY:-/dev/null}"
