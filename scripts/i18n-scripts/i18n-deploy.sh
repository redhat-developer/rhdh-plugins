#!/usr/bin/env bash
set -euo pipefail

# i18n Deploy - Deploy downloaded translations to TypeScript files
# Focused on the deployment workflow only

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_usage() {
  echo "RHDH Plugins - i18n Deploy"
  echo ""
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Deploy downloaded translations to TypeScript files"
  echo ""
  echo "Options:"
  echo "  --dry-run         Show what would be deployed without doing it"
  echo "  --force           Force deployment even if files seem unchanged"
  echo "  --languages LANGS Target languages (default: fr)"
  echo "  --release VER     RHDH release version (default: from config)"
  echo "  --help            Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                          # Deploy with defaults"
  echo "  $0 --dry-run                 # Check what would be deployed"
  echo "  $0 --languages fr,es,de      # Deploy for multiple languages"
  echo ""
  echo "Prerequisites:"
  echo "  1. Downloaded translations must exist in ui-i18n-downloads/\$RHDH_RELEASE/"
  echo "  2. Run 'yarn i18n download' first if no files exist"
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

DOWNLOAD_DIR="$REPO_ROOT/ui-i18n-downloads/$RHDH_RELEASE"

# Helper functions
log() { echo "🔍 $1"; }
success() { echo "✅ $1"; }
warning() { echo "⚠️  $1"; }
error() { echo "❌ $1"; }

# Main deploy logic
log "i18n Deploy to TypeScript"
echo "    Languages: $LANGUAGES"
echo "    Release: $RHDH_RELEASE"
echo "    Dry Run: $DRY_RUN"
echo ""

# Check if download directory exists
if [[ ! -d "$DOWNLOAD_DIR" ]]; then
  error "No download directory found: $DOWNLOAD_DIR"
  echo ""
  echo "Run 'yarn i18n download' first to download translations."
  exit 1
fi

# Check if downloaded files exist
download_count=$(find "$DOWNLOAD_DIR" -name "*.json" 2>/dev/null | wc -l)
if [[ $download_count -eq 0 ]]; then
  error "No downloaded translation files found in $DOWNLOAD_DIR"
  echo ""
  echo "Run 'yarn i18n download' first to download translations."
  exit 1
fi

log "Found $download_count downloaded translation files"

# Show files that would be deployed
echo "Files to deploy:"
find "$DOWNLOAD_DIR" -name "*.json" -exec basename {} \; | sed 's/^/  - /'

if [[ "$DRY_RUN" == true ]]; then
  log "Dry run mode - no files were actually deployed"
  echo ""
  echo "To actually deploy, run:"
  echo "  $0"
  exit 0
fi

echo ""
log "Deploying to TypeScript files..."

# Run the actual deployment
if "$SCRIPT_DIR/deploy-translations.sh"; then
  success "Deployment completed successfully"
  echo ""
  echo "Deployed translations to TypeScript files in:"
  echo "  - workspaces/*/plugins/*/src/translations/"
  echo ""
  echo "Next steps:"
  echo "  1. Review the updated TypeScript files"
  echo "  2. Test the application with new translations"
  echo "  3. Commit changes if everything looks good"
else
  error "Deployment failed"
  exit 1
fi

