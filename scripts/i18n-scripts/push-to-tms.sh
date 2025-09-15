#!/usr/bin/env bash
set -euo pipefail

# Upload existing JSON files to TMS
# This script only uploads - does not generate files

# Parse command line arguments
OVERRIDE_RELEASE=""
OVERRIDE_PROJECT_ID=""
OVERRIDE_TARGET_LANGS=""

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Upload existing JSON files to TMS (Translation Management System)"
  echo ""
  echo "Options:"
  echo "  -r, --release VERSION       RHDH release version (default: from config)"
  echo "  -p, --project-id ID         TMS project ID (default: from config)"
  echo "  -t, --target-langs LANGS    Target languages (comma-separated, default: fr)"
  echo "  -h, --help                  Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                          # Upload with config defaults"
  echo "  $0 -t 'fr,es,de'            # Upload with multiple target languages"
  echo "  $0 -p 12345 -r 1.9          # Upload to specific project/release"
  echo ""
  echo "Prerequisites:"
  echo "  1. JSON files must exist in ui-i18n/\$RHDH_RELEASE/"
  echo "  2. Run 'yarn i18n-generate' first if no files exist"
  echo "  3. TMS authentication must be configured"
}

while [[ $# -gt 0 ]]; do
  case $1 in
    -r|--release)
      OVERRIDE_RELEASE="$2"
      shift 2
      ;;
    -p|--project-id)
      OVERRIDE_PROJECT_ID="$2"
      shift 2
      ;;
    -t|--target-langs)
      OVERRIDE_TARGET_LANGS="$2"
      shift 2
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

# cd to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# Source configuration
source "$SCRIPT_DIR/i18n.config.sh"

# Apply overrides
[[ -n "$OVERRIDE_RELEASE" ]] && RHDH_RELEASE="$OVERRIDE_RELEASE"
[[ -n "$OVERRIDE_PROJECT_ID" ]] && TMS_PROJECT_ID="$OVERRIDE_PROJECT_ID"
[[ -n "$OVERRIDE_TARGET_LANGS" ]] && TARGET_LANGS="$OVERRIDE_TARGET_LANGS"

# Set default target language if not specified
TARGET_LANGS="${TARGET_LANGS:-fr}"

echo "==> i18n Upload to TMS"
echo "    RHDH Release: $RHDH_RELEASE"
echo "    Project ID: $TMS_PROJECT_ID" 
echo "    Target Languages: $TARGET_LANGS"

# --- Release/host normalization ----------------------------------------------
: "${RHDH_RELEASE:=1.8}"
: "${MEMSOURCE_HOST:=${MEMSOURCE_URL:-https://cloud.memsource.com/web}}"
: "${TMS_PROJECT_ID:?TMS_PROJECT_ID not set in i18n.config.sh or env}"

# --- Check for existing files ------------------------------------------------
STAGING_DIR="$REPO_ROOT/ui-i18n/$RHDH_RELEASE"
echo "    Source Directory: $STAGING_DIR"
echo ""

if [[ ! -d "$STAGING_DIR" ]]; then
  echo "❌ No staging directory found: $STAGING_DIR"
  echo ""
  echo "Please generate JSON files first:"
  echo "   yarn i18n-generate"
  exit 1
fi

json_count=$(find "$STAGING_DIR" -name "*.json" | wc -l | tr -d ' ')
if [[ $json_count -eq 0 ]]; then
  echo "❌ No JSON files found in: $STAGING_DIR"
  echo ""
  echo "Please generate JSON files first:"
  echo "   yarn i18n-generate"
  exit 1
fi

echo "📁 Found $json_count JSON files to upload:"
find "$STAGING_DIR" -name "*.json" -exec basename {} \; | sed 's/^/  - /'
echo ""

# --- Cache setup --------------------------------------------------------------
CACHE_DIR="$REPO_ROOT/.ui-i18n-cache/$RHDH_RELEASE"
mkdir -p "$CACHE_DIR"

# --- Helper functions ---------------------------------------------------------
fail_if_missing_auth() {
  if [[ -z "${MEMSOURCE_TOKEN:-}" ]]; then
    echo "❌ MEMSOURCE_TOKEN environment variable is required"
    echo "   Please set your TMS authentication token"
    exit 1
  fi
}

should_upload() {
  local file="$1"
  local cache_file="$CACHE_DIR/$(basename "$file").uploaded"
  
  if [[ ! -f "$cache_file" ]]; then
    return 0  # Should upload (not cached)
  fi
  
  # Check if file is newer than cache
  if [[ "$file" -nt "$cache_file" ]]; then
    return 0  # Should upload (file is newer)
  fi
  
  return 1  # Skip upload (already uploaded and unchanged)
}

mark_uploaded() {
  local file="$1"
  local cache_file="$CACHE_DIR/$(basename "$file").uploaded"
  touch "$cache_file"
}

# --- Validate JSON files -----------------------------------------------------
echo "==> Validating JSON files"
validation_errors=0

while IFS= read -r -d '' f; do
  if ! jq empty "$f" >/dev/null 2>&1; then
    echo "❌ Invalid JSON: $(basename "$f")"
    ((validation_errors++))
  fi
done < <(find "$STAGING_DIR" -maxdepth 1 -type f -name '*.json' -print0)

if [[ $validation_errors -gt 0 ]]; then
  echo "❌ Found $validation_errors invalid JSON files. Please fix before uploading."
  exit 1
fi

echo "✅ All JSON files are valid"
echo ""

# --- Upload preparation ------------------------------------------------------
fail_if_missing_auth

echo "==> Uploading to TMS project $TMS_PROJECT_ID (host: $MEMSOURCE_HOST)"

# Collect files that need uploading
uploaded=0; skipped=0
files_to_upload=()

while IFS= read -r -d '' f; do
  if should_upload "$f"; then
    echo "  → will upload: $(basename "$f")"
    files_to_upload+=("$f")
    ((uploaded++))
  else
    echo "  → skip (unchanged): $(basename "$f")"
    ((skipped++))
  fi
done < <(find "$STAGING_DIR" -maxdepth 1 -type f -name '*-en.json' -print0)

echo ""

# --- Perform upload ----------------------------------------------------------
if [[ ${#files_to_upload[@]} -gt 0 ]]; then
  echo "==> Uploading ${#files_to_upload[@]} files to TMS..."
  upload_success=0
  upload_failed=0
  
  for file in "${files_to_upload[@]}"; do
    echo "  → Uploading: $(basename "$file")"
    if bash "$SCRIPT_DIR/memsource-upload.sh" -v "$RHDH_RELEASE" -s "${SPRINT_NUMBER}" -t "$TARGET_LANGS" "$file"; then
      echo "    ✅ Upload successful"
      mark_uploaded "$file"  # Only cache after successful upload
      ((upload_success++))
    else
      echo "    ❌ Upload failed - will retry next run"
      ((upload_failed++))
    fi
  done
  
  echo ""
  echo "Upload results: ${upload_success} successful, ${upload_failed} failed"
else
  echo "ℹ️  No files need uploading (all are cached/unchanged)"
fi

# --- Summary ------------------------------------------------------------------
echo ""
echo "📊 Upload Summary:"
echo "   Files uploaded: $uploaded"
echo "   Files skipped: $skipped"
echo ""
echo "✅ Upload complete!"
echo ""
echo "🔄 Next steps:"
echo "   1. Wait for translations to be completed in TMS"
echo "   2. Download translations: yarn i18n-download"
echo "   3. Deploy to plugins: yarn i18n-deploy"
echo "   4. Sync with TypeScript: yarn i18n-sync"
echo ""
echo "💡 Useful commands:"
echo "   yarn i18n-generate --force    # Regenerate JSON files"
echo "   yarn i18n-download            # Download completed translations"
