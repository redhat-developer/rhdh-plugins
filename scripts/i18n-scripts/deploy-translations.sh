#!/usr/bin/env bash
set -euo pipefail

# Deploy downloaded translations to their original source locations
# This script takes downloaded translation files and puts them back where the ref.ts files are located

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_usage() {
  echo "Deploy Downloaded Translations"
  echo ""
  echo "Usage: $0 [OPTIONS] [FILES...]"
  echo ""
  echo "Options:"
  echo "  --source-dir DIR     Directory containing downloaded translation files (default: repo root)"
  echo "  --dry-run           Show what would be deployed without actually doing it"
  echo "  --clean-source      Remove source files after successful deployment"
  echo "  -h, --help          Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                                    # Deploy all translation files from repo root"
  echo "  $0 --source-dir ui-i18n-downloads/   # Deploy from specific directory"
  echo "  $0 --dry-run                         # Preview deployment without changes"
  echo "  $0 file1-fr.json file2-es.json      # Deploy specific files"
}

# Parse arguments
SOURCE_DIR="$REPO_ROOT"
DRY_RUN=false
CLEAN_SOURCE=false
SPECIFIC_FILES=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --source-dir)
      SOURCE_DIR="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --clean-source)
      CLEAN_SOURCE=true
      shift
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      SPECIFIC_FILES+=("$1")
      shift
      ;;
  esac
done

echo "==> Translation Deployment"
echo "Source Directory: $SOURCE_DIR"
echo "Dry Run: $DRY_RUN"
echo "Clean Source: $CLEAN_SOURCE"
echo ""

# Function to parse filename and determine target location
deploy_translation_file() {
  local file_path="$1"
  local filename=$(basename "$file_path")
  
  # Parse filename: rhdh-plugins__workspaces__PLUGIN__plugins__PLUGIN__src__translations__ref-en-LANG-C.json
  if [[ "$filename" =~ ^rhdh-plugins__workspaces__([^_]+)__plugins__([^_]+)__src__translations__ref-en-([^-]+)-[^.]+\.json$ ]]; then
    local plugin_name="${BASH_REMATCH[1]}"
    local plugin_name2="${BASH_REMATCH[2]}"
    local language="${BASH_REMATCH[3]}"
    
    # Verify plugin names match (they should be the same)
    if [[ "$plugin_name" != "$plugin_name2" ]]; then
      echo "  ⚠️  Plugin name mismatch in filename: $plugin_name vs $plugin_name2"
      return 1
    fi
    
    # Construct target path
    local target_dir="$REPO_ROOT/workspaces/$plugin_name/plugins/$plugin_name/src/translations"
    local target_file="$target_dir/ref-$language.json"
    
    echo "  → Plugin: $plugin_name, Language: $language"
    
    # Check if target directory exists
    if [[ ! -d "$target_dir" ]]; then
      echo "    ❌ Target directory doesn't exist: $target_dir"
      return 1
    fi
    
    # Check if ref.ts exists (validation that this is the right location)
    if [[ ! -f "$target_dir/ref.ts" ]]; then
      echo "    ⚠️  No ref.ts found in target directory: $target_dir"
      echo "    ⚠️  This might not be the correct location"
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
      echo "    [DRY RUN] Would copy: $file_path → $target_file"
    else
      echo "    📁 Deploying: $target_file"
      cp "$file_path" "$target_file"
      
      # Clean source file if requested
      if [[ "$CLEAN_SOURCE" == true ]]; then
        rm "$file_path"
        echo "    🗑️  Removed source: $file_path"
      fi
    fi
    
    return 0
  else
    echo "  ❌ Unrecognized filename pattern: $filename"
    return 1
  fi
}

# Find translation files to deploy
deployed=0
failed=0

if [[ ${#SPECIFIC_FILES[@]} -gt 0 ]]; then
  # Deploy specific files provided as arguments
  echo "==> Deploying ${#SPECIFIC_FILES[@]} specific file(s)..."
  
  for file in "${SPECIFIC_FILES[@]}"; do
    if [[ -f "$file" ]]; then
      echo "Processing: $(basename "$file")"
      if deploy_translation_file "$file"; then
        ((deployed++))
      else
        ((failed++))
      fi
    else
      echo "  ❌ File not found: $file"
      ((failed++))
    fi
    echo ""
  done
  
else
  # Find and deploy all translation files in source directory
  echo "==> Discovering translation files in: $SOURCE_DIR"
  
  # Look for translation files (not English source files)
  translation_files=()
  while IFS= read -r -d '' file; do
    filename=$(basename "$file")
    # Skip English source files, only process actual translations
    # Match pattern: ref-en-LANG-C.json (where LANG is the target language)
    if [[ "$filename" =~ ref-en-[a-z]{2}(-[A-Z]{2})?-[A-Z]\.json$ ]]; then
      translation_files+=("$file")
    fi
  done < <(find "$SOURCE_DIR" -maxdepth 1 -name "*ref-*.json" -print0)
  
  echo "  → Found ${#translation_files[@]} translation file(s)"
  echo ""
  
  if [[ ${#translation_files[@]} -eq 0 ]]; then
    echo "  ℹ️  No translation files found to deploy"
    exit 0
  fi
  
  echo "==> Deploying ${#translation_files[@]} translation file(s)..."
  
  for file in "${translation_files[@]}"; do
    echo "Processing: $(basename "$file")"
    if deploy_translation_file "$file"; then
      ((deployed++))
    else
      ((failed++))
    fi
    echo ""
  done
fi

# Summary
echo "==> Deployment Summary"
echo "  ✅ Successfully deployed: $deployed"
echo "  ❌ Failed: $failed"

if [[ $failed -gt 0 ]]; then
  echo ""
  echo "❌ Some deployments failed. Please check the errors above."
  exit 1
else
  echo ""
  echo "🎉 All translations deployed successfully!"
  
  if [[ "$CLEAN_SOURCE" == true ]]; then
    echo "🗑️  Source files have been cleaned up"
  else
    echo "💡 To clean up source files after deployment, use --clean-source"
  fi
fi
