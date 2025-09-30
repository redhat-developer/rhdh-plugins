#!/usr/bin/env bash
set -euo pipefail

# i18n Download - Download translations from TMS
# Focused on the download workflow only

# Load authentication from .memsourcerc if it exists
[[ -f "$HOME/.memsourcerc" ]] && source "$HOME/.memsourcerc"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_usage() {
  echo "RHDH Plugins - i18n Download"
  echo ""
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Download completed translations from TMS"
  echo ""
  echo "Options:"
  echo "  --dry-run         Show what would be downloaded without doing it"
  echo "  --force           Force download even if files exist"
  echo "  --languages LANGS Target languages (default: fr)"
  echo "  --release VER     RHDH release version (default: from config)"
  echo "  --clean-before    Clean download directory before downloading"
  echo "  --help            Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                          # Download with defaults"
  echo "  $0 --dry-run                 # Check what would be downloaded"
  echo "  $0 --languages fr,es,de      # Download for multiple languages"
  echo "  $0 --clean-before            # Clean and download fresh"
  echo ""
  echo "Prerequisites:"
  echo "  1. Translations must be completed in TMS"
  echo "  2. TMS authentication must be configured"
}

# Parse arguments
DRY_RUN=false
FORCE=false
LANGUAGES="fr"
RELEASE=""
CLEAN_BEFORE=false

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
    --clean-before)
      CLEAN_BEFORE=true
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
[[ -n "$RELEASE" ]] && RHDH_RELEASE="$RELEASE"

DOWNLOAD_DIR="$REPO_ROOT/ui-i18n-downloads/$RHDH_RELEASE"

# Helper functions
log() { echo "🔍 $1"; }
success() { echo "✅ $1"; }
warning() { echo "⚠️  $1"; }
error() { echo "❌ $1"; }

# Main download logic
log "i18n Download from TMS"
echo "    Languages: $LANGUAGES"
echo "    Release: $RHDH_RELEASE"
echo "    Dry Run: $DRY_RUN"
echo "    Clean Before: $CLEAN_BEFORE"
echo ""

# Check if download directory already has files
if [[ -d "$DOWNLOAD_DIR" && $(find "$DOWNLOAD_DIR" -name "*.json" 2>/dev/null | wc -l) -gt 0 ]]; then
  existing_count=$(find "$DOWNLOAD_DIR" -name "*.json" 2>/dev/null | wc -l)
  warning "Found $existing_count existing downloaded files"
  
  if [[ "$CLEAN_BEFORE" == true ]]; then
    log "Cleaning download directory..."
    rm -rf "$DOWNLOAD_DIR"
    mkdir -p "$DOWNLOAD_DIR"
  elif [[ "$FORCE" == false ]]; then
    echo "Options:"
    echo "  1. Use --clean-before to clean and download fresh"
    echo "  2. Use --force to download anyway (may create duplicates)"
    echo "  3. Check existing files first"
    echo ""
    echo "Existing files:"
    find "$DOWNLOAD_DIR" -name "*.json" -exec basename {} \; | sed 's/^/  - /'
    exit 0
  fi
fi

if [[ "$DRY_RUN" == true ]]; then
  log "Dry run mode - would download translations for languages: $LANGUAGES"
  echo ""
  echo "To actually download, run:"
  echo "  $0"
  exit 0
fi

log "Downloading from TMS..."

# Run the actual download
if "$SCRIPT_DIR/collect-and-download.sh" --languages "$LANGUAGES" --clean-before; then
  success "Download completed successfully"
  echo ""
  
  # Show what was downloaded
  if [[ -d "$DOWNLOAD_DIR" ]]; then
    download_count=$(find "$DOWNLOAD_DIR" -name "*.json" 2>/dev/null | wc -l)
    echo "Downloaded $download_count files:"
    find "$DOWNLOAD_DIR" -name "*.json" -exec basename {} \; | sed 's/^/  - /'
  fi
  
  echo ""
  echo "Next steps:"
  echo "  1. Review downloaded translations"
  echo "  2. Run 'yarn i18n deploy' to deploy to TypeScript files"
else
  error "Download failed"
  exit 1
fi
