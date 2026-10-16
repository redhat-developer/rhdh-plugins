#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -ne 3 ]]; then
  echo "usage: check-ci-fix-diff.sh <repo> <base-sha> <workspace>" >&2
  exit 2
fi

repo="$1"
base_sha="$2"
workspace="$3"
prefix="workspaces/${workspace}/"

[[ -d "${repo}/.git" ]] || { echo "extracted repository is missing" >&2; exit 1; }
[[ "${base_sha}" =~ ^[0-9a-f]{40}$ ]] || { echo "invalid base SHA" >&2; exit 1; }
[[ "${workspace}" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "invalid workspace" >&2; exit 1; }

head_sha="$(git -C "${repo}" rev-parse HEAD)"
git -C "${repo}" cat-file -e "${base_sha}^{commit}"
[[ "$(git -C "${repo}" rev-list --count "${base_sha}..${head_sha}")" -eq 1 ]] || {
  echo "repair must add exactly one commit" >&2
  exit 1
}
[[ "$(git -C "${repo}" rev-parse "${head_sha}^")" == "${base_sha}" ]] || {
  echo "repair commit is not a direct child of the analyzed head" >&2
  exit 1
}
[[ "$(git -C "${repo}" show -s --format=%P "${head_sha}" | wc -w | tr -d ' ')" -eq 1 ]] || {
  echo "merge commits are forbidden" >&2
  exit 1
}
subject="$(git -C "${repo}" show -s --format=%s "${head_sha}")"
[[ "${subject}" == "fix(ci-agent):"* ]] || { echo "unexpected repair commit subject" >&2; exit 1; }

files=()
while IFS= read -r -d '' file; do
  [[ -n "${file}" && "${file}" != *$'\n'* && "${file}" != *$'\r'* && "${file}" != *$'\t'* ]] || {
    echo "unsafe changed path" >&2
    exit 1
  }
  [[ "${file}" == "${prefix}"* ]] || { echo "path outside failed workspace: ${file}" >&2; exit 1; }
  mode="$(git -C "${repo}" ls-tree "${head_sha}" -- "${file}" | awk 'NR == 1 {print $1}')"
  [[ -z "${mode}" || "${mode}" == "100644" || "${mode}" == "100755" ]] || {
    echo "symlink, gitlink, or unsupported file mode: ${file}" >&2
    exit 1
  }
  base_mode="$(git -C "${repo}" ls-tree "${base_sha}" -- "${file}" | awk 'NR == 1 {print $1}')"
  [[ -z "${base_mode}" || "${base_mode}" == "100644" || "${base_mode}" == "100755" ]] || {
    echo "changed base file is a symlink, gitlink, or unsupported mode: ${file}" >&2
    exit 1
  }
  files+=("${file}")
done < <(git -C "${repo}" diff --no-renames --name-only -z "${base_sha}..${head_sha}")

file_count="${#files[@]}"
[[ "${file_count}" -gt 0 && "${file_count}" -le 20 ]] || {
  echo "changed file count ${file_count} is outside 1..20" >&2
  exit 1
}

changed_lines=0
while IFS=$'\t' read -r added deleted _path; do
  [[ "${added}" =~ ^[0-9]+$ && "${deleted}" =~ ^[0-9]+$ ]] || {
    echo "binary or unparsable diff detected" >&2
    exit 1
  }
  changed_lines=$((changed_lines + added + deleted))
done < <(git -C "${repo}" diff --no-renames --numstat "${base_sha}..${head_sha}")
[[ "${changed_lines}" -le 800 ]] || { echo "changed line count ${changed_lines} exceeds 800" >&2; exit 1; }

printf '%s\0' "${files[@]}" | jq -Rs \
  --arg head "${head_sha}" \
  --argjson file_count "${file_count}" \
  --argjson changed_lines "${changed_lines}" \
  '{head_sha: $head, file_count: $file_count, changed_lines: $changed_lines, files: (split("\u0000") | map(select(length > 0)))}'
