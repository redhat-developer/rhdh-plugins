#!/usr/bin/env bash
set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN is required}"
: "${REPO_FULL_NAME:?REPO_FULL_NAME is required}"
: "${GITHUB_ISSUE_URL:?GITHUB_ISSUE_URL is required}"
: "${CI_CONTEXT_FILE:?CI_CONTEXT_FILE is required}"
export GH_TOKEN
echo "::add-mask::${GH_TOKEN}"

[[ "${REPO_FULL_NAME}" =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$ ]] || {
  echo "::error::Invalid repository identity" >&2
  exit 1
}
[[ "${GITHUB_ISSUE_URL}" =~ ^https://github\.com/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+/pull/[1-9][0-9]*$ ]] || {
  echo "::error::CI triage requires a GitHub pull request URL" >&2
  exit 1
}
[[ -f "${CI_CONTEXT_FILE}" ]] || { echo "::error::Trusted dispatch context is missing" >&2; exit 1; }
jq -e '
  ._fullsend_ci.version == 1
  and ._fullsend_ci.kind == "triage"
  and (._fullsend_ci.run_id | type == "number")
  and (._fullsend_ci.run_attempt | type == "number")
  and (._fullsend_ci.head_sha | test("^[0-9a-f]{40}$"))
' "${CI_CONTEXT_FILE}" >/dev/null || { echo "::error::Trusted dispatch context is invalid" >&2; exit 1; }

pr_number="${GITHUB_ISSUE_URL##*/}"
ctx_pr="$(jq -r '.pull_request.number' "${CI_CONTEXT_FILE}")"
head_sha="$(jq -r '._fullsend_ci.head_sha' "${CI_CONTEXT_FILE}")"
[[ "${pr_number}" == "${ctx_pr}" ]] || { echo "::error::PR URL and context disagree" >&2; exit 1; }

current_pr="$(gh api "repos/${REPO_FULL_NAME}/pulls/${pr_number}")"
[[ "$(jq -r '.state' <<<"${current_pr}")" == "open" ]] || { echo "::error::PR is not open" >&2; exit 1; }
[[ "$(jq -r '.head.sha' <<<"${current_pr}")" == "${head_sha}" ]] || { echo "::error::PR head is stale" >&2; exit 1; }

repo_dir="${TARGET_REPO:-${GITHUB_WORKSPACE:-}/target-repo}"
[[ -d "${repo_dir}/.git" ]] || { echo "::error::Target repository checkout is missing" >&2; exit 1; }
git -C "${repo_dir}" config core.hooksPath /dev/null
gh auth setup-git
git -C "${repo_dir}" fetch --no-tags --depth=1 origin "refs/pull/${pr_number}/head"
git -C "${repo_dir}" -c advice.detachedHead=false checkout --detach --force FETCH_HEAD
[[ "$(git -C "${repo_dir}" rev-parse HEAD)" == "${head_sha}" ]] || {
  echo "::error::Detached checkout does not match the analyzed head" >&2
  exit 1
}
[[ -z "$(git -C "${repo_dir}" status --porcelain)" ]] || {
  echo "::error::Target repository is not clean after checkout" >&2
  exit 1
}

echo "CI triage preflight passed for PR #${pr_number} at ${head_sha:0:12}"
