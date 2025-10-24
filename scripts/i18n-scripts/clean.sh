#!/usr/bin/env bash
set -euo pipefail

# i18n Clean - Clean up temporary files and caches

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Parse arguments
DRY_RUN=false

show_usage() {
  echo "i18n Clean - Clean up temporary files and caches"
  echo ""
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --dry-run         Show what would be cleaned without doing it"
  echo "  --help            Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                    # Clean up temporary files"
  echo "  $0 --dry-run          # Show what would be cleaned"
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
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

# Helper functions
log() { echo "🔍 $1"; }
success() { echo "✅ $1"; }
warning() { echo "⚠️  $1"; }
error() { echo "❌ $1"; }

log "Cleaning up temporary files and caches"

if [[ "$DRY_RUN" == true ]]; then
  log "Dry run mode - would clean up:"
  echo "  - Temporary directories: ui-i18n-temp*"
  echo "  - Upload cache: .ui-i18n-cache"
  echo "  - Download cache: .ui-i18n-download-cache"
  echo "  - Backup files (via cleanup-backups.sh)"
  exit 0
fi

# Clean up temp directories
log "Cleaning temporary directories..."
rm -rf "$REPO_ROOT/ui-i18n-temp"* 2>/dev/null || true
rm -rf "$REPO_ROOT/.ui-i18n-cache" 2>/dev/null || true
rm -rf "$REPO_ROOT/.ui-i18n-download-cache" 2>/dev/null || true

# Clean up backup files
log "Cleaning backup files..."
"$SCRIPT_DIR/cleanup-backups.sh" --force >/dev/null 2>&1 || true

success "Cleanup completed"
