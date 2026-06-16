#!/usr/bin/env bash
#
# Generate Codecov component definitions from overlay repo metadata.
#
# This script extracts workspaces grouped by support level (GA, Tech-Preview,
# Community, Dev-Preview) from rhdh-plugin-export-overlays metadata files and
# generates a YAML fragment for the codecov.yml component_management block.
#
# Usage:
#   ./scripts/generate-codecov-components.sh [overlay-repo-path]
#
# Example:
#   ./scripts/generate-codecov-components.sh ../rhdh-plugin-export-overlays
#
# Output:
#   Prints YAML component definitions to stdout. Redirect to file if needed:
#   ./scripts/generate-codecov-components.sh > codecov-components.yaml
#
# Related:
#   - RHIDP-13511: Add per-support-level coverage reporting to Codecov
#   - Epic RHIDP-13497: Plugin Testing by Support Level

set -euo pipefail

# Default to sibling directory if not provided
OVERLAY_REPO="${1:-../rhdh-plugin-export-overlays}"

if [[ ! -d "$OVERLAY_REPO/workspaces" ]]; then
  echo "ERROR: Overlay repo not found at $OVERLAY_REPO" >&2
  echo "Usage: $0 [overlay-repo-path]" >&2
  exit 1
fi

# Function to extract unique workspaces for a given support level
get_workspaces_by_support() {
  local support_level="$1"

  # Find files, extract workspace name (directory between "workspaces/" and "/metadata/")
  grep -l "support: $support_level" "$OVERLAY_REPO"/workspaces/*/metadata/*.yaml 2>/dev/null | \
    sed 's|.*/workspaces/\([^/]*\)/metadata/.*|\1|' | \
    sort -u || true
}

# Function to generate component YAML
generate_component() {
  local component_id="$1"
  local component_name="$2"
  local support_level="$3"

  echo "    - component_id: $component_id"
  echo "      name: \"$component_name\""
  echo "      paths:"

  get_workspaces_by_support "$support_level" | while read -r workspace; do
    if [[ -n "$workspace" ]]; then
      echo "        - workspaces/$workspace/"
    fi
  done

  echo ""
}

# Print header
cat << 'EOF'
# Codecov component definitions generated from overlay repo metadata
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# Source: rhdh-plugin-export-overlays/workspaces/*/metadata/*.yaml
#
# Add this to rhdh-plugins/codecov.yml under component_management:

component_management:
  individual_components:
EOF

# Generate components for each support level
generate_component "ga-plugins" "GA Plugins" "generally-available"
generate_component "tech-preview-plugins" "Tech-Preview Plugins" "tech-preview"
generate_component "community-plugins" "Community Plugins" "community"
generate_component "dev-preview-plugins" "Dev-Preview Plugins" "dev-preview"

# Print summary to stderr
{
  echo ""
  echo "Summary:"
  echo "  GA:          $(get_workspaces_by_support "generally-available" | wc -l | tr -d ' ') workspaces"
  echo "  Tech-Preview: $(get_workspaces_by_support "tech-preview" | wc -l | tr -d ' ') workspaces"
  echo "  Community:    $(get_workspaces_by_support "community" | wc -l | tr -d ' ') workspaces"
  echo "  Dev-Preview:  $(get_workspaces_by_support "dev-preview" | wc -l | tr -d ' ') workspaces"
} >&2
