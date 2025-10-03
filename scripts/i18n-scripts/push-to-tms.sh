#!/usr/bin/env bash
set -euo pipefail

# push-to-tms.sh - Push JSON files to TMS using memsource CLI
# This script is called by i18n-upload.sh to perform the actual upload

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source configuration
source "$SCRIPT_DIR/i18n.config.sh"

# Source memsource setup
source "$SCRIPT_DIR/memsource-setup.sh"

# Parse arguments
TARGET_LANGUAGES="fr"

while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--target-languages)
      TARGET_LANGUAGES="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Setup memsource environment
if ! setup_memsource_with_project "$TMS_PROJECT_ID"; then
  exit 1
fi

# Find JSON files to upload
JSON_DIR="$REPO_ROOT/ui-i18n/$RHDH_RELEASE"
if [[ ! -d "$JSON_DIR" ]]; then
  echo "❌ JSON directory not found: $JSON_DIR"
  echo "Run 'yarn i18n generate' first to create JSON files"
  exit 1
fi

# Get list of JSON files
json_files=($(find "$JSON_DIR" -name "*.json" -type f))

if [[ ${#json_files[@]} -eq 0 ]]; then
  echo "❌ No JSON files found in $JSON_DIR"
  echo "Run 'yarn i18n generate' first to create JSON files"
  exit 1
fi

echo "🔍 Uploading ${#json_files[@]} JSON files to TMS..."

# Upload each JSON file
for json_file in "${json_files[@]}"; do
  filename=$(basename "$json_file")
  
  # Check if this file was already uploaded and content hasn't changed
  cache_file="$REPO_ROOT/.ui-i18n-cache/$RHDH_RELEASE/${filename}.uploaded"
  if [[ -f "$cache_file" ]]; then
    # Get current file hash
    current_hash=$(md5sum "$json_file" | cut -d' ' -f1)
    # Get cached hash
    cached_hash=$(cat "$cache_file" 2>/dev/null || echo "")
    
    if [[ "$current_hash" == "$cached_hash" ]]; then
      echo "⏭️  Skipping (content unchanged): $filename"
      continue
    else
      echo "🔄 Content changed, re-uploading: $filename"
    fi
  fi
  
  echo "📤 Uploading: $filename"
  
  # Extract language from filename (e.g., ref-en.json -> en)
  if [[ "$filename" =~ ref-([a-z]{2})\.json$ ]]; then
    source_lang="${BASH_REMATCH[1]}"
  else
    echo "⚠️  Could not determine source language from filename: $filename"
    continue
  fi
  
  # Upload to memsource using the working memsource-upload.sh script
  if "$SCRIPT_DIR/memsource-upload.sh" -v "$RHDH_RELEASE" -s "$SPRINT_NUMBER" "$json_file"; then
    echo "✅ Successfully uploaded: $filename"
    
    # Create cache file with file hash to track content changes
    mkdir -p "$(dirname "$cache_file")"
    current_hash=$(md5sum "$json_file" | cut -d' ' -f1)
    echo "$current_hash" > "$cache_file"
    echo "💾 Cached upload status with hash: $filename"
  else
    echo "❌ Failed to upload: $filename"
    exit 1
  fi
done

echo "✅ All files uploaded successfully to TMS"
