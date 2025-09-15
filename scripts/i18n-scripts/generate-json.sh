#!/usr/bin/env bash
set -euo pipefail

# Generate JSON files from TypeScript translation files
# This script only generates - does not upload

# Parse command line arguments
OVERRIDE_RELEASE=""
OVERRIDE_SPRINT=""
FORCE_REGENERATE=false

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Generate JSON files from TypeScript translation files"
  echo ""
  echo "Options:"
  echo "  -r, --release VERSION       RHDH release version (default: from config)"
  echo "  -s, --sprint NUMBER         Sprint number (default: from config)"
  echo "  --force                     Regenerate even if files exist"
  echo "  -h, --help                  Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                          # Generate with config defaults"
  echo "  $0 -r 1.9 -s 3280          # Generate for specific release/sprint"
  echo "  $0 --force                  # Force regeneration of existing files"
  echo ""
  echo "Output:"
  echo "  Files are generated in: ui-i18n/\$RHDH_RELEASE/"
  echo ""
  echo "Next steps:"
  echo "  1. Review generated JSON files"
  echo "  2. Run 'yarn i18n-push' to upload to TMS"
}

while [[ $# -gt 0 ]]; do
  case $1 in
    -r|--release)
      OVERRIDE_RELEASE="$2"
      shift 2
      ;;
    -s|--sprint)
      OVERRIDE_SPRINT="$2"
      shift 2
      ;;
    --force)
      FORCE_REGENERATE=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

# cd to repo root (so node module resolution works)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# Source configuration
source "$SCRIPT_DIR/i18n.config.sh"

# Apply overrides
[[ -n "$OVERRIDE_RELEASE" ]] && RHDH_RELEASE="$OVERRIDE_RELEASE"
[[ -n "$OVERRIDE_SPRINT" ]] && SPRINT_NUMBER="$OVERRIDE_SPRINT"

echo "==> i18n JSON Generation"
echo "    RHDH Release: $RHDH_RELEASE"
echo "    Sprint: $SPRINT_NUMBER"
echo "    Force Regenerate: $FORCE_REGENERATE"

# --- Release/host normalization ----------------------------------------------
: "${RHDH_RELEASE:=1.8}"

# --- Staging directories ------------------------------------------------------
STAGING_DIR="$REPO_ROOT/ui-i18n/$RHDH_RELEASE"
GENERATED_DIR="$STAGING_DIR"

echo "    Output Directory: $STAGING_DIR"
echo ""

# Check if files already exist
if [[ -d "$STAGING_DIR" && $(find "$STAGING_DIR" -name "*.json" | wc -l) -gt 0 ]]; then
  existing_count=$(find "$STAGING_DIR" -name "*.json" | wc -l)
  echo "⚠️  Found $existing_count existing JSON files in $STAGING_DIR"
  
  if [[ "$FORCE_REGENERATE" == false ]]; then
    echo ""
    echo "Options:"
    echo "  1. Use --force to regenerate all files"
    echo "  2. Run 'yarn i18n-push' to upload existing files"
    echo "  3. Remove $STAGING_DIR to start fresh"
    echo ""
    echo "Existing files:"
    find "$STAGING_DIR" -name "*.json" -exec basename {} \; | sed 's/^/  - /'
    echo ""
    echo "❌ Skipping generation. Use --force to regenerate."
    exit 0
  else
    echo "🔄 Force regeneration enabled - removing existing files"
    rm -rf "$STAGING_DIR"
  fi
fi

mkdir -p "$STAGING_DIR"

# --- Helper functions from original script -----------------------------------
source_ts_files() {
  local repo_dir="$1"
  find "$repo_dir" -path "*/src/translations/ref.ts" -type f
}

# Function to copy existing JSON files (for compatibility)
copy_jsons() {
  local repo_dir="$1"
  local prefix="$2"
  
  # Copy any existing JSON files from previous runs
  find "$repo_dir" -path "*/ui-i18n/*" -name "*-en.json" -exec cp {} "$STAGING_DIR/" \; 2>/dev/null || true
}

# --- Step 1: generate JSON from TS refs --------------------------------------
echo "==> Generating JSON from TS refs"
echo "Scanning rhdh-plugins repository:"
echo "  RHDH_PLUGINS_DIR=$RHDH_PLUGINS_DIR"

generated_count=0
skipped_count=0

while IFS= read -r tsfile; do
  echo "• Generating JSON from TS: $tsfile"
  
  # Convert path to output filename
  relative_path="${tsfile#$RHDH_PLUGINS_DIR/}"
  out="$GENERATED_DIR/rhdh-plugins__${relative_path//\//__}"
  out="${out%.ts}-en.json"
  
  if node "$SCRIPT_DIR/extract-ts-messages.mjs" --ts "$tsfile" --out "$out"; then
    ((generated_count++))
  else
    echo "  (skip) Could not extract from $tsfile"
    ((skipped_count++))
  fi
done < <(source_ts_files "$RHDH_PLUGINS_DIR")

# --- Step 2: collect existing English catalogs -------------------------------
echo "==> Collecting existing English catalogs"
copy_jsons "$RHDH_PLUGINS_DIR" "rhdh-plugins"

# --- Step 3: validate JSON ----------------------------------------------------
echo "==> Validating JSON"
ok=1
validation_errors=0

while IFS= read -r -d '' f; do
  if ! jq empty "$f" >/dev/null 2>&1; then
    echo "❌ Invalid JSON: $f"
    ok=0
    ((validation_errors++))
  fi
done < <(find "$STAGING_DIR" -maxdepth 1 -type f -name '*.json' -print0)

if [[ $ok -eq 0 ]]; then
  echo "❌ Found $validation_errors invalid JSON files. Please fix before uploading."
  exit 1
fi

# --- Summary -------------------------------------------------------------------
total_files=$(find "$STAGING_DIR" -name "*.json" | wc -l | tr -d ' ')
total_size=$(du -sh "$STAGING_DIR" | cut -f1)

echo ""
echo "✅ JSON Generation Complete!"
echo ""
echo "📊 Summary:"
echo "   Generated: $generated_count files"
echo "   Skipped: $skipped_count files"
echo "   Total JSON files: $total_files"
echo "   Total size: $total_size"
echo "   Location: $STAGING_DIR"
echo ""
echo "📁 Generated files:"
find "$STAGING_DIR" -name "*.json" -exec basename {} \; | sed 's/^/  - /'
echo ""
echo "🔍 Next steps:"
echo "   1. Review the generated JSON files in: $STAGING_DIR"
echo "   2. Upload to TMS: yarn i18n-push"
echo "   3. Or regenerate: yarn i18n-generate --force"
echo ""
echo "💡 Quick file review:"
echo "   ls -la $STAGING_DIR"
echo "   jq keys $STAGING_DIR/*.json | head -20"
