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

# Display order for the support levels that already exist, plus nothing else.
# The set of levels is DISCOVERED from the overlay metadata (see
# discover_support_levels), so a brand-new level is picked up automatically; this
# list only controls the order known levels appear in and which appear first — it
# is not the source of truth for which levels exist. Any discovered level missing
# from here is appended in sorted order, never dropped.
SUPPORT_LEVEL_ORDER=(generally-available tech-preview community dev-preview)

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

# Distinct spec.support values present anywhere in the overlay metadata. This is
# the source of truth for which support levels exist — a new level shows up here
# automatically.
discover_support_levels() {
  grep -hE "^[[:space:]]*support:[[:space:]]*[[:alnum:]_-]+[[:space:]]*$" \
    "$OVERLAY_REPO"/workspaces/*/metadata/*.yaml 2>/dev/null \
    | sed -E 's|^[[:space:]]*support:[[:space:]]*||; s|[[:space:]]*$||' \
    | LC_ALL=C sort -u || true
}

# Discovered support levels, ordered: the known ones first (in SUPPORT_LEVEL_ORDER),
# then any newly-introduced level appended in sorted order so it is never dropped.
ordered_support_levels() {
  local discovered known lvl
  discovered="$(discover_support_levels)"
  for known in "${SUPPORT_LEVEL_ORDER[@]}"; do
    if printf '%s\n' "$discovered" | grep -qxF "$known"; then
      echo "$known"
    fi
  done
  printf '%s\n' "$discovered" | while read -r lvl; do
    [[ -n "$lvl" ]] || continue
    case " ${SUPPORT_LEVEL_ORDER[*]} " in
      *" $lvl "*) ;; # already emitted in the known-order pass above
      *) echo "$lvl" ;;
    esac
  done
}

# component_id and display name for a support level. Both derive mechanically
# (<level>-plugins / Title-Case Plugins); "generally-available" is the one value
# that needs an explicit alias because "GA" can't be derived from the string.
component_id_for() {
  case "$1" in
    generally-available) echo "ga-plugins" ;;
    *) echo "${1}-plugins" ;;
  esac
}

component_name_for() {
  case "$1" in
    generally-available) echo "GA Plugins" ;;
    *) echo "$(printf '%s' "$1" | awk -F- 'BEGIN{OFS="-"}{for(i=1;i<=NF;i++)$i=toupper(substr($i,1,1)) substr($i,2)}1') Plugins" ;;
  esac
}

# Render the YAML for one component. Skips a level that has no workspace in this
# repo so we never emit an empty component.
generate_component() {
  local component_id="$1" component_name="$2" support_level="$3"
  local list count
  list="$(get_workspaces_by_support "$support_level")"
  [[ -z "$list" ]] && return 0
  count="$(printf '%s\n' "$list" | wc -l | tr -d ' ')"

  echo "    # ${component_name} — ${count} workspace(s)"
  echo "    - component_id: ${component_id}"
  echo "      name: '${component_name}'"
  echo "      paths:"
  printf '%s\n' "$list" | while read -r ws; do
    echo "        - workspaces/${ws}/"
  done
}

# Render the full component_management block (deterministic: no timestamps, so
# --check is stable across runs). Both the support levels and their workspace
# paths are derived from the overlay metadata — nothing here is a fixed list.
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
  local level
  ordered_support_levels | while read -r level; do
    [[ -n "$level" ]] || continue
    generate_component "$(component_id_for "$level")" "$(component_name_for "$level")" "$level"
  done
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
  *)
    # Unreachable today (MODE is set only by the flag parser), but guards against
    # a future flag that sets MODE without adding a matching branch here.
    echo "ERROR: internal error: unknown mode '$MODE' (expected print, write, or check)." >&2
    exit 2
    ;;
esac

# Summary to stderr (skipped in --check to keep CI output focused on the diff).
if [[ "$MODE" != "check" ]]; then
  {
    echo ""
    echo "Summary (workspaces present in this repo):"
    ordered_support_levels | while read -r level; do
      [[ -n "$level" ]] || continue
      count="$(get_workspaces_by_support "$level" | grep -c '^' || true)"
      printf '  %-22s %s\n' "$(component_name_for "$level"):" "$count"
    done
  } >&2
fi
