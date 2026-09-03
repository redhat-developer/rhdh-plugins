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
pr_number="${GITHUB_ISSUE_URL##*/}"
tool_dir=""
scan_dir=""
report_sent="false"
context_loaded="false"

remove_ephemeral_labels() {
  local label encoded
  for label in fullsend-ci-fix fullsend-ci-retry; do
    encoded="$(printf '%s' "${label}" | jq -sRr @uri)"
    gh api "repos/${REPO_FULL_NAME}/issues/${pr_number}/labels/${encoded}" -X DELETE --silent >/dev/null 2>&1 || true
  done
}

report_blocked() {
  local reason="$1"
  [[ "${context_loaded}" == "true" ]] || return 0
  local marker="<!-- fullsend:ci-fix-result run=${run_id} attempt=${run_attempt} head=${base_sha} commit=none outcome=blocked iteration=${iteration} -->"
  gh label create needs-human --repo "${REPO_FULL_NAME}" --color B60205 \
    --description "Autonomous CI repair needs maintainer attention" --force >/dev/null 2>&1 || true
  gh api "repos/${REPO_FULL_NAME}/issues/${pr_number}/labels" -f 'labels[]=needs-human' --silent >/dev/null 2>&1 || true
  existing="$(gh api --paginate "repos/${REPO_FULL_NAME}/issues/${pr_number}/comments" --jq '.[].body' 2>/dev/null || true)"
  if ! grep -Fq -- "${marker}" <<<"${existing}"; then
    gh api "repos/${REPO_FULL_NAME}/issues/${pr_number}/comments" \
      -f body="${marker}
### Fullsend CI repair stopped

${reason}" --silent >/dev/null 2>&1 || true
  fi
  report_sent="true"
}

on_exit() {
  local code=$?
  remove_ephemeral_labels
  [[ -z "${tool_dir}" ]] || rm -rf -- "${tool_dir}"
  [[ -z "${scan_dir}" ]] || rm -rf -- "${scan_dir}"
  if [[ "${code}" -ne 0 && "${report_sent}" != "true" ]]; then
    report_blocked "Host-side safety validation failed before a push."
  fi
}
trap on_exit EXIT

fail() {
  local reason="$1"
  report_blocked "${reason}"
  echo "::error::${reason}" >&2
  exit 1
}

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
[[ -n "${result_file}" && -f "${result_file}" ]] || fail "Validated fix result was not found."
[[ -f "${CI_CONTEXT_FILE}" ]] || fail "Trusted CI context was not found."
jq empty "${result_file}"
jq empty "${CI_CONTEXT_FILE}"

run_id="$(jq -r '._fullsend_ci.run_id' "${CI_CONTEXT_FILE}")"
run_attempt="$(jq -r '._fullsend_ci.run_attempt' "${CI_CONTEXT_FILE}")"
base_sha="$(jq -r '._fullsend_ci.head_sha' "${CI_CONTEXT_FILE}")"
workspace="$(jq -r '._fullsend_ci.workspace' "${CI_CONTEXT_FILE}")"
iteration="$(jq -r '._fullsend_ci.iteration' "${CI_CONTEXT_FILE}")"
head_ref="$(jq -r '.pull_request.head.ref' "${CI_CONTEXT_FILE}")"
ctx_pr="$(jq -r '.pull_request.number' "${CI_CONTEXT_FILE}")"
ctx_mode="$(jq -r '._fullsend_ci.automation_mode' "${CI_CONTEXT_FILE}")"
context_loaded="true"

[[ "${ctx_pr}" == "${pr_number}" ]] || fail "The PR number does not match trusted dispatch context."
[[ "${ctx_mode}" == "repair" ]] || fail "Repair mode is no longer active."
[[ "$(jq -r '.pr.number' "${result_file}")" == "${pr_number}" ]] || fail "Agent result PR does not match."
[[ "$(jq -r '.pr.head_sha' "${result_file}")" == "${base_sha}" ]] || fail "Agent result head does not match."
[[ "$(jq -r '.analyzed_head_sha' "${result_file}")" == "${base_sha}" ]] || fail "Analyzed head does not match."
[[ "$(jq -r '.run.id' "${result_file}")" == "${run_id}" ]] || fail "Agent result run does not match."
[[ "$(jq -r '.run.attempt' "${result_file}")" == "${run_attempt}" ]] || fail "Agent result attempt does not match."
[[ "$(jq -r '.workspace' "${result_file}")" == "${workspace}" ]] || fail "Agent changed the workspace boundary."
[[ "$(jq -r '.iteration' "${result_file}")" == "${iteration}" ]] || fail "Agent changed the repair iteration."
[[ "$(jq -r '.pr.head_ref' "${result_file}")" == "${head_ref}" ]] || fail "Agent result branch does not match."

current_pr="$(gh api "repos/${REPO_FULL_NAME}/pulls/${pr_number}")"
[[ "$(jq -r '.state' <<<"${current_pr}")" == "open" ]] || fail "The PR is no longer open."
[[ "$(jq -r '.head.sha' <<<"${current_pr}")" == "${base_sha}" ]] || fail "The PR head changed during repair."
[[ "$(jq -r '.head.repo.full_name' <<<"${current_pr}")" == "${REPO_FULL_NAME}" ]] || fail "Fork branches are diagnosis-only."
if jq -e '.labels | any(.[]; .name == "fullsend-no-fix")' <<<"${current_pr}" >/dev/null; then
  fail "The fullsend-no-fix kill switch is active."
fi

status="$(jq -r '.status' "${result_file}")"
if [[ "${status}" != "committed" ]]; then
  report_blocked "The agent could not reproduce and verify a safe repair; no commit was pushed."
  exit 0
fi
if ! jq -e '.verification | length > 0 and all(.[]; .passed == true and .exit_code == 0)' "${result_file}" >/dev/null; then
  fail "Required targeted verification did not pass."
fi

repo_dir="${REPO_DIR:-}"
[[ -n "${repo_dir}" && -d "${repo_dir}/.git" ]] || fail "Validated extracted repository is unavailable."
[[ -z "$(git -C "${repo_dir}" status --porcelain)" ]] || fail "Repair worktree contains uncommitted changes."
local_head="$(git -C "${repo_dir}" rev-parse HEAD)"
[[ "$(jq -r '.commit' "${result_file}")" == "${local_head}" ]] || fail "Result commit does not match the extracted repository."

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
guard_json="$(${script_dir}/check-ci-fix-diff.sh "${repo_dir}" "${base_sha}" "${workspace}")" || fail "The derived repair diff violated safety limits."

install_gitleaks
scan_dir="$(mktemp -d)"
cp "${result_file}" "${scan_dir}/agent-result.json"
git -C "${repo_dir}" diff --binary --no-ext-diff "${base_sha}..${local_head}" >"${scan_dir}/repair.patch"
if ! gitleaks detect --source "${scan_dir}" --no-git --redact; then
  fail "Secret scanning rejected the result or derived patch."
fi

# Final stale-head check immediately before the non-force push.
current_pr="$(gh api "repos/${REPO_FULL_NAME}/pulls/${pr_number}")"
[[ "$(jq -r '.state' <<<"${current_pr}")" == "open" ]] || fail "The PR closed before push."
[[ "$(jq -r '.head.sha' <<<"${current_pr}")" == "${base_sha}" ]] || fail "The PR advanced before push."
[[ "$(jq -r '.head.ref' <<<"${current_pr}")" == "${head_ref}" ]] || fail "The PR branch changed before push."

gh auth setup-git
remote_head="$(git -C "${repo_dir}" ls-remote origin "refs/heads/${head_ref}" | awk 'NR == 1 {print $1}')"
[[ "${remote_head}" == "${base_sha}" ]] || fail "The remote branch no longer points to the analyzed head."
if ! git -C "${repo_dir}" push --porcelain origin "${local_head}:refs/heads/${head_ref}"; then
  fail "The fast-forward push was rejected."
fi

marker="<!-- fullsend:ci-fix-result run=${run_id} attempt=${run_attempt} head=${base_sha} commit=${local_head} outcome=committed iteration=${iteration} -->"
files="$(jq -r '.files[] | "- `" + gsub("`"; "ˋ") + "`"' <<<"${guard_json}")"
gh api "repos/${REPO_FULL_NAME}/issues/${pr_number}/comments" \
  -f body="${marker}
### Fullsend CI repair pushed

Pushed one guarded fast-forward commit, \`${local_head:0:12}\`, for repair iteration ${iteration}.

${files}

Targeted verification passed. CI will run again and report the eventual outcome." --silent

{
  echo "### Fullsend CI repair telemetry"
  echo "- iteration: ${iteration}"
  echo "- commit: ${local_head}"
  echo "- files: $(jq -r '.file_count' <<<"${guard_json}")"
  echo "- changed lines: $(jq -r '.changed_lines' <<<"${guard_json}")"
} >>"${GITHUB_STEP_SUMMARY:-/dev/null}"
