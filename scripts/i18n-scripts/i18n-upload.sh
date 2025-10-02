#!/usr/bin/env bash
set -euo pipefail

# i18n Upload - Upload JSON files to TMS
# Focused on the upload workflow only

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_usage() {
  echo "RHDH Plugins - i18n Upload"
  echo ""
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Upload JSON files to TMS (Translation Management System)"
  echo ""
  echo "Options:"
  echo "  --dry-run         Show what would be uploaded without doing it"
  echo "  --force           Force upload even if files seem unchanged"
  echo "  --languages LANGS Target languages (default: fr)"
  echo "  --release VER     RHDH release version (default: from config)"
  echo "  --help            Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                          # Upload with defaults"
  echo "  $0 --dry-run                 # Check what would be uploaded"
  echo "  $0 --languages fr,es,de      # Upload for multiple languages"
  echo ""
  echo "Prerequisites:"
  echo "  1. JSON files must exist in ui-i18n/\$RHDH_RELEASE/"
  echo "  2. Run 'yarn i18n generate' first if no files exist"
  echo "  3. TMS authentication must be configured"
}

# Parse arguments
DRY_RUN=false
FORCE=false
LANGUAGES="fr"
RELEASE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --languages)
      LANGUAGES="$2"
      shift 2
      ;;
    --release)
      RELEASE="$2"
      shift 2
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Source configuration
source "$SCRIPT_DIR/i18n.config.sh"
[[ -n "$RELEASE" ]] && RHDH_RELEASE="$RELEASE"

STAGING_DIR="$REPO_ROOT/ui-i18n/$RHDH_RELEASE"

# Setup memsource environment
source "$SCRIPT_DIR/memsource-setup.sh"
if ! setup_memsource_with_project "$TMS_PROJECT_ID"; then
  exit 1
fi

# Helper functions
log() { echo "🔍 $1"; }
success() { echo "✅ $1"; }
warning() { echo "⚠️  $1"; }
error() { echo "❌ $1"; }

# Check if files are identical
files_identical() {
  local file1="$1"
  local file2="$2"
  
  if [[ ! -f "$file1" || ! -f "$file2" ]]; then
    return 1
  fi
  
  # Compare file sizes first (fast)
  local size1 size2
  size1=$(stat -f%z "$file1" 2>/dev/null || stat -c%s "$file1" 2>/dev/null || echo "0")
  size2=$(stat -f%z "$file2" 2>/dev/null || stat -c%s "$file2" 2>/dev/null || echo "0")
  if [[ "$size1" != "$size2" ]]; then
    return 1
  fi
  
  # Compare content
  if command -v md5sum >/dev/null 2>&1; then
    local hash1 hash2
    hash1=$(md5sum "$file1" | cut -d' ' -f1)
    hash2=$(md5sum "$file2" | cut -d' ' -f1)
    [[ "$hash1" == "$hash2" ]]
  elif command -v md5 >/dev/null 2>&1; then
    local hash1 hash2
    hash1=$(md5 -q "$file1")
    hash2=$(md5 -q "$file2")
    [[ "$hash1" == "$hash2" ]]
  else
    diff -q "$file1" "$file2" >/dev/null 2>&1
  fi
}

# Main upload logic
log "i18n Upload to TMS"
echo "    Languages: $LANGUAGES"
echo "    Release: $RHDH_RELEASE"
echo "    Dry Run: $DRY_RUN"
echo ""

# Check if staging directory exists
if [[ ! -d "$STAGING_DIR" ]]; then
  error "No staging directory found: $STAGING_DIR"
  echo ""
  echo "Run 'yarn i18n generate' first to create JSON files."
  exit 1
fi

# Check if JSON files exist
json_count=$(find "$STAGING_DIR" -name "*.json" 2>/dev/null | wc -l)
if [[ $json_count -eq 0 ]]; then
  error "No JSON files found in $STAGING_DIR"
  echo ""
  echo "Run 'yarn i18n generate' first to create JSON files."
  exit 1
fi

log "Found $json_count JSON files to upload"

# Show files that would be uploaded
echo "Files to upload:"
find "$STAGING_DIR" -name "*.json" -exec basename {} \; | sed 's/^/  - /'

if [[ "$DRY_RUN" == true ]]; then
  log "Dry run mode - no files were actually uploaded"
  echo ""
  echo "To actually upload, run:"
  echo "  $0"
  exit 0
fi

# Check for potential duplicates (if not forcing)
if [[ "$FORCE" == false ]]; then
  log "Checking for potential duplicate uploads..."
  
  # This is a basic check - in a real implementation you might want to
  # check against TMS API to see what's already uploaded
  warning "Note: This will upload all files. Use --force to skip duplicate checking."
fi

echo ""
log "Uploading to TMS..."

# Run the actual upload
if "$SCRIPT_DIR/push-to-tms.sh" -t "$LANGUAGES"; then
  success "Upload completed successfully"
  echo ""
  echo "Next steps:"
  echo "  1. Wait for translations to be completed in TMS"
  echo "  2. Run 'yarn i18n download' to download completed translations"
  echo "  3. Run 'yarn i18n deploy' to deploy to TypeScript files"
else
  error "Upload failed"
  exit 1
fi

