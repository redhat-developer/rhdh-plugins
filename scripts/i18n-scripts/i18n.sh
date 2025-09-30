#!/usr/bin/env bash
set -euo pipefail

# Simplified i18n workflow - One script to rule them all
# Replaces: generate-json.sh, push-to-tms.sh, collect-and-download.sh, deploy-translations.sh, smart-i18n-workflow.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_usage() {
  echo "RHDH Plugins - Simplified i18n Workflow"
  echo ""
  echo "Usage: $0 [COMMAND] [OPTIONS]"
  echo ""
  echo "Commands:"
  echo "  generate    Generate JSON files from ref.ts files"
  echo "  upload      Upload JSON files to TMS"
  echo "  download    Download translations from TMS"
  echo "  deploy      Deploy downloaded translations to TypeScript files"
  echo "  status      Show current status"
  echo "  clean       Clean up temporary files"
  echo ""
  echo "Options:"
  echo "  --dry-run         Show what would be done without doing it"
  echo "  --force           Force operations even if files exist"
  echo "  --languages LANGS Target languages (default: fr)"
  echo "  --release VER     RHDH release version (default: from config)"
  echo "  --help            Show this help"
  echo ""
  echo "Examples:"
  echo "  $0 generate                    # Generate JSON files"
  echo "  $0 upload --dry-run            # Check what would be uploaded"
  echo "  $0 status                       # Show current status"
  echo ""
  echo "Quick Start:"
  echo "  $0 generate && $0 upload      # Generate and upload"
  echo "  $0 download && $0 deploy      # Download and deploy"
}

# Parse arguments
COMMAND=""
DRY_RUN=false
FORCE=false
LANGUAGES="fr"
RELEASE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    generate|upload|download|deploy|status|clean)
      COMMAND="$1"
      shift
      ;;
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

if [[ -z "$COMMAND" ]]; then
  echo "Error: No command specified"
  show_usage
  exit 1
fi

# Source configuration
source "$SCRIPT_DIR/i18n.config.sh"
[[ -n "$RELEASE" ]] && RHDH_RELEASE="$RELEASE"

STAGING_DIR="$REPO_ROOT/ui-i18n/$RHDH_RELEASE"
DOWNLOAD_DIR="$REPO_ROOT/ui-i18n-downloads/$RHDH_RELEASE"

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

# Generate JSON files
generate() {
  log "Generating JSON files from ref.ts"
  
  if [[ "$DRY_RUN" == true ]]; then
    log "Would generate JSON files to: $STAGING_DIR"
    return 0
  fi
  
  # Check if files already exist and are up to date
  if [[ -d "$STAGING_DIR" && $(find "$STAGING_DIR" -name "*.json" 2>/dev/null | wc -l) -gt 0 && "$FORCE" == false ]]; then
    existing_count=$(find "$STAGING_DIR" -name "*.json" 2>/dev/null | wc -l)
    warning "Found $existing_count existing JSON files"
    
    # Quick check: if ref.ts files haven't changed, skip generation
    log "Checking if regeneration is needed..."
    
    # Create temp directory for comparison
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf '$TEMP_DIR'" EXIT
    
    # Generate to temp directory
    RHDH_RELEASE_TEMP="$RHDH_RELEASE-temp"
    TEMP_STAGING="$REPO_ROOT/ui-i18n/$RHDH_RELEASE_TEMP"
    
    # Temporarily modify generation to use temp directory
    sed "s|ui-i18n/$RHDH_RELEASE|ui-i18n/$RHDH_RELEASE_TEMP|g" "$SCRIPT_DIR/generate-json.sh" > "$TEMP_DIR/generate-temp.sh"
    chmod +x "$TEMP_DIR/generate-temp.sh"
    
    if "$TEMP_DIR/generate-temp.sh" --force >/dev/null 2>&1; then
      # Compare files
      changed_files=0
      for existing_file in "$STAGING_DIR"/*.json; do
        if [[ -f "$existing_file" ]]; then
          basename_file=$(basename "$existing_file")
          new_file="$TEMP_STAGING/$basename_file"
          
          if [[ -f "$new_file" ]] && ! files_identical "$existing_file" "$new_file"; then
            changed_files=$((changed_files + 1))
            log "File changed: $basename_file"
          fi
        fi
      done
      
      # Cleanup temp directory
      rm -rf "$TEMP_STAGING"
      
      if [[ $changed_files -eq 0 ]]; then
        success "No changes detected - existing files are up to date"
        return 0
      else
        log "Detected $changed_files changed files - regeneration needed"
      fi
    fi
  fi
  
  # Run actual generation
  if [[ "$FORCE" == true ]]; then
    "$SCRIPT_DIR/generate-json.sh" --force
  else
    "$SCRIPT_DIR/generate-json.sh"
  fi
  
  success "JSON generation completed"
}

# Upload to TMS
upload() {
  log "Uploading to TMS"
  
  if [[ ! -d "$STAGING_DIR" ]]; then
    error "No staging directory found. Run 'generate' first."
    exit 1
  fi
  
  if [[ $(find "$STAGING_DIR" -name "*.json" 2>/dev/null | wc -l) -eq 0 ]]; then
    error "No JSON files found in $STAGING_DIR"
    exit 1
  fi
  
  if [[ "$DRY_RUN" == true ]]; then
    log "Would upload $(find "$STAGING_DIR" -name "*.json" | wc -l) files to TMS"
    log "Files to upload:"
    find "$STAGING_DIR" -name "*.json" -exec basename {} \;
    return 0
  fi
  
  # Run upload
  "$SCRIPT_DIR/i18n-upload.sh" --languages "$LANGUAGES"
  
  success "Upload completed"
}

# Download from TMS
download() {
  log "Downloading from TMS"
  
  if [[ "$DRY_RUN" == true ]]; then
    log "Would download translations for languages: $LANGUAGES"
    return 0
  fi
  
  # Run download
  "$SCRIPT_DIR/i18n-download.sh" --languages "$LANGUAGES" --clean-before
  
  success "Download completed"
}

# Deploy translations
deploy() {
  log "Deploying translations"
  
  if [[ "$DRY_RUN" == true ]]; then
    log "Would deploy translations to TypeScript files"
    return 0
  fi
  
  # Run deployment
  "$SCRIPT_DIR/i18n-deploy.sh"
  
  success "Deployment completed"
}

# Show status
status() {
  log "Current Status"
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
  else
    echo "📥 Download Directory: Not found"
  fi
  
  echo ""
  echo "🔧 Available commands:"
  echo "   $0 generate    - Generate JSON from ref.ts files"
  echo "   $0 upload      - Upload to TMS"
  echo "   $0 download    - Download from TMS"
  echo "   $0 deploy      - Deploy to TypeScript files"
  echo "   $0 clean       - Clean up files"
}

# Clean up
clean() {
  log "Cleaning up temporary files"
  
  if [[ "$DRY_RUN" == true ]]; then
    log "Would clean up temporary files and caches"
    return 0
  fi
  
  # Clean up temp directories
  rm -rf "$REPO_ROOT/ui-i18n-temp"* 2>/dev/null || true
  rm -rf "$REPO_ROOT/.ui-i18n-cache" 2>/dev/null || true
  rm -rf "$REPO_ROOT/.ui-i18n-download-cache" 2>/dev/null || true
  
  # Clean up backup files
  "$SCRIPT_DIR/cleanup-backups.sh" --force >/dev/null 2>&1 || true
  
  success "Cleanup completed"
}


# Main command handling
case "$COMMAND" in
  generate)
    generate
    ;;
  upload)
    upload
    ;;
  download)
    download
    ;;
  deploy)
    deploy
    ;;
  status)
    status
    ;;
  clean)
    clean
    ;;
  *)
    error "Unknown command: $COMMAND"
    show_usage
    exit 1
    ;;
esac
