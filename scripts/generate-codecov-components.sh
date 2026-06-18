#!/usr/bin/env bash
#
# Generate / sync Codecov component definitions from overlay repo metadata.
#
# Support level for every plugin lives in rhdh-plugin-export-overlays as the
# `spec.support` field of each package metadata file:
#
#   rhdh-plugin-export-overlays/workspaces/<ws>/metadata/<package>.yaml
#     spec:
#       support: generally-available | tech-preview | community | dev-preview
#
# This script reads those files, groups workspaces by support level, keeps only
# the workspaces that actually exist in THIS repository, and renders the
# `component_management` block of codecov.yml. A plugin that is promoted in the
# overlay (e.g. tech-preview -> generally-available) is therefore moved to the
# matching Codecov component automatically the next time this runs.
#
# Modes:
#   (no flag)   Print the component_management block to stdout.
#   --write     Rewrite the component_management block in codecov.yml in place.
#   --check     Exit non-zero (and print a diff) if codecov.yml is out of sync
#               with the overlay metadata. Used by CI to detect drift.
#
# Options:
#   --overlay <path>   Path to a checkout of rhdh-plugin-export-overlays.
#                      Defaults to ../rhdh-plugin-export-overlays.
#                      (A bare positional path is also accepted for back-compat.)
#
# Examples:
#   ./scripts/generate-codecov-components.sh --overlay ../rhdh-plugin-export-overlays
#   ./scripts/generate-codecov-components.sh --write --overlay ../rhdh-plugin-export-overlays
#   ./scripts/generate-codecov-components.sh --check --overlay ../rhdh-plugin-export-overlays
#
# Related:
#   - RHIDP-13511: Add per-support-level coverage reporting to Codecov
#   - Epic RHIDP-13497: Plugin Testing by Support Level
#   - .github/workflows/sync-codecov-components.yml (scheduled sync + PR check)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODECOV_FILE="$REPO_ROOT/codecov.yml"

MODE="print"
OVERLAY_REPO="../rhdh-plugin-export-overlays"

usage() {
  cat <<'EOF'
Generate / sync the Codecov component_management block from overlay metadata.

Support level for every plugin lives in rhdh-plugin-export-overlays as the
spec.support field of each package metadata file. This script groups the
workspaces that exist in THIS repository by support level and renders the
component_management block of codecov.yml.

Usage:
  generate-codecov-components.sh [--write|--check] [--overlay <path>]

Modes:
  (no flag)   Print the component_management block to stdout.
  --write     Rewrite the component_management block in codecov.yml in place.
  --check     Exit non-zero (and print a diff) if codecov.yml is out of sync
              with the overlay metadata. Used by CI to detect drift.

Options:
  --overlay <path>   Path to a checkout of rhdh-plugin-export-overlays
                     (default: ../rhdh-plugin-export-overlays). A bare
                     positional path is also accepted for back-compat.
  -h, --help         Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --write) MODE="write"; shift ;;
    --check) MODE="check"; shift ;;
    --overlay) OVERLAY_REPO="${2:?--overlay requires a path}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    --*) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 2 ;;
    *) OVERLAY_REPO="$1"; shift ;; # back-compat: positional overlay path
  esac
done

if [[ ! -d "$OVERLAY_REPO/workspaces" ]]; then
  echo "ERROR: overlay repo not found at '$OVERLAY_REPO' (expected a 'workspaces' directory)." >&2
  echo "Pass --overlay <path-to-rhdh-plugin-export-overlays>." >&2
  exit 1
fi

# Print the workspaces (one per line) that have the given support level in the
# overlay metadata AND exist as a workspace directory in this repository.
get_workspaces_by_support() {
  local support_level="$1"
  grep -lE "^[[:space:]]*support:[[:space:]]*${support_level}[[:space:]]*$" \
    "$OVERLAY_REPO"/workspaces/*/metadata/*.yaml 2>/dev/null \
    | sed -e 's|^.*/workspaces/||' -e 's|/metadata/.*||' \
    | LC_ALL=C sort -u \
    | while read -r ws; do
        [[ -n "$ws" && -d "$REPO_ROOT/workspaces/$ws" ]] && echo "$ws"
      done || true
}

# Render the YAML for a single component.
generate_component() {
  local component_id="$1" component_name="$2" support_level="$3"
  local list count
  list="$(get_workspaces_by_support "$support_level")"
  if [[ -z "$list" ]]; then count=0; else count="$(printf '%s\n' "$list" | wc -l | tr -d ' ')"; fi

  echo "    # ${component_name} — ${count} workspace(s)"
  echo "    - component_id: ${component_id}"
  echo "      name: '${component_name}'"
  if [[ "$count" -eq 0 ]]; then
    echo "      paths: []"
  else
    echo "      paths:"
    printf '%s\n' "$list" | while read -r ws; do
      echo "        - workspaces/${ws}/"
    done
  fi
}

# Render the full component_management block (deterministic: no timestamps, so
# --check is stable across runs).
generate_block() {
  cat <<'EOF'
component_management:
  # GENERATED — do not edit by hand.
  # Source of truth: rhdh-plugin-export-overlays metadata (spec.support field).
  # Regenerate with: scripts/generate-codecov-components.sh --write --overlay <overlay-repo>
  # Drift is detected on PRs and synced weekly by
  # .github/workflows/sync-codecov-components.yml.
  # Only workspaces that exist in this repository are included.
  # Note: workspaces with mixed support-level packages appear in multiple components.
  individual_components:
EOF
  generate_component "ga-plugins"           "GA Plugins"            "generally-available"
  generate_component "tech-preview-plugins" "Tech-Preview Plugins"  "tech-preview"
  generate_component "community-plugins"    "Community Plugins"     "community"
  generate_component "dev-preview-plugins"  "Dev-Preview Plugins"   "dev-preview"
}

# Produce a copy of codecov.yml with the component_management block replaced by a
# freshly generated one, written to $1. Implemented as a head/body/tail splice so
# it stays portable across GNU and BSD/macOS awk & sed.
render_codecov() {
  local out="$1" start end

  start="$(grep -n '^component_management:' "$CODECOV_FILE" | head -1 | cut -d: -f1)"
  if [[ -z "$start" ]]; then
    echo "ERROR: codecov.yml has no 'component_management:' block to replace." >&2
    return 1
  fi
  # First top-level key after the block (e.g. flag_management:); empty if the
  # block runs to end of file.
  end="$(awk -v s="$start" 'NR>s && /^[A-Za-z_][A-Za-z0-9_]*:/ { print NR; exit }' "$CODECOV_FILE")"

  {
    [[ "$start" -gt 1 ]] && sed -n "1,$((start - 1))p" "$CODECOV_FILE"
    generate_block
    if [[ -n "$end" ]]; then
      echo ""                                    # blank line before next top-level key
      sed -n "${end},\$p" "$CODECOV_FILE"
    fi
  } > "$out"
}

case "$MODE" in
  print)
    generate_block
    ;;
  write)
    # Temp file lives next to the target so the final mv is an atomic rename on
    # the same filesystem (no risk of a half-written codecov.yml).
    tmp="$(mktemp "${CODECOV_FILE}.XXXXXX")"
    trap 'rm -f "$tmp"' EXIT
    render_codecov "$tmp"
    if cmp -s "$tmp" "$CODECOV_FILE"; then
      echo "codecov.yml already in sync with overlay metadata." >&2
    else
      mv "$tmp" "$CODECOV_FILE"
      echo "Updated component_management block in codecov.yml." >&2
    fi
    ;;
  check)
    tmp="$(mktemp)"
    trap 'rm -f "$tmp"' EXIT
    render_codecov "$tmp"
    if cmp -s "$tmp" "$CODECOV_FILE"; then
      echo "OK: codecov.yml component_management is in sync with overlay metadata." >&2
    else
      echo "DRIFT: codecov.yml component_management is out of sync with overlay metadata." >&2
      echo "Run: scripts/generate-codecov-components.sh --write --overlay <overlay-repo>" >&2
      echo "--- diff (actual codecov.yml vs overlay-derived) ---" >&2
      diff -u "$CODECOV_FILE" "$tmp" >&2 || true
      exit 1
    fi
    ;;
esac

# Summary to stderr (skipped in --check to keep CI output focused on the diff).
if [[ "$MODE" != "check" ]]; then
  {
    echo ""
    echo "Summary (workspaces present in this repo):"
    echo "  GA:           $(get_workspaces_by_support generally-available | grep -c '^' || true)"
    echo "  Tech-Preview: $(get_workspaces_by_support tech-preview | grep -c '^' || true)"
    echo "  Community:    $(get_workspaces_by_support community | grep -c '^' || true)"
    echo "  Dev-Preview:  $(get_workspaces_by_support dev-preview | grep -c '^' || true)"
  } >&2
fi
