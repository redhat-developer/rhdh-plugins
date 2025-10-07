#!/usr/bin/env bash
set -euo pipefail

# i18n Status - Show current status of i18n files and directories

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source configuration
source "$SCRIPT_DIR/i18n.config.sh"

STAGING_DIR="$REPO_ROOT/ui-i18n/$RHDH_RELEASE"
DOWNLOAD_DIR="$REPO_ROOT/ui-i18n-downloads/$RHDH_RELEASE"

# Helper functions
log() { echo "🔍 $1"; }
success() { echo "✅ $1"; }
warning() { echo "⚠️  $1"; }
error() { echo "❌ $1"; }

# Show status
log "Current i18n Status"
echo ""

# Check staging directory
if [[ -d "$STAGING_DIR" ]]; then
  staging_count=$(find "$STAGING_DIR" -name "*.json" 2>/dev/null | wc -l)
  echo "📁 Staging Directory: $staging_count files in $STAGING_DIR"
  if [[ $staging_count -gt 0 ]]; then
    echo "   Files:"
    find "$STAGING_DIR" -name "*.json" -exec basename {} \; | sed 's/^/     - /'
  fi
else
  echo "📁 Staging Directory: Not found"
fi

echo ""

# Check download directory
if [[ -d "$DOWNLOAD_DIR" ]]; then
  download_count=$(find "$DOWNLOAD_DIR" -name "*.json" 2>/dev/null | wc -l)
  echo "📥 Download Directory: $download_count files in $DOWNLOAD_DIR"
  if [[ $download_count -gt 0 ]]; then
    echo "   Files:"
    find "$DOWNLOAD_DIR" -name "*.json" -exec basename {} \; | sed 's/^/     - /'
  fi
else
  echo "📥 Download Directory: Not found"
fi

echo ""

# Check cache directories
CACHE_DIR="$REPO_ROOT/.ui-i18n-cache/$RHDH_RELEASE"
DOWNLOAD_CACHE_DIR="$REPO_ROOT/.ui-i18n-download-cache/$RHDH_RELEASE"

if [[ -d "$CACHE_DIR" ]]; then
  cache_count=$(find "$CACHE_DIR" -name "*.uploaded" 2>/dev/null | wc -l)
  echo "💾 Upload Cache: $cache_count cached files"
else
  echo "💾 Upload Cache: Not found"
fi

if [[ -d "$DOWNLOAD_CACHE_DIR" ]]; then
  download_cache_count=$(find "$DOWNLOAD_CACHE_DIR" -name "*" -type f 2>/dev/null | wc -l)
  echo "💾 Download Cache: $download_cache_count cached jobs"
else
  echo "💾 Download Cache: Not found"
fi

echo ""
echo "🔧 Available commands:"
echo "   yarn i18n:generate    - Generate JSON from ref.ts files"
echo "   yarn i18n:upload      - Upload to TMS"
echo "   yarn i18n:download    - Download from TMS"
echo "   yarn i18n:deploy      - Deploy to TypeScript files"
echo "   yarn i18n:clean       - Clean up files"
