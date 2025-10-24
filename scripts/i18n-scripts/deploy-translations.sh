#!/usr/bin/env bash
set -euo pipefail

# Deploy Translations - Merge JSON translations into TypeScript files
# This script takes downloaded ref-*.json files and merges them into the corresponding ref.ts files

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_usage() {
  echo "Deploy Translations to TypeScript Files"
  echo ""
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Merge downloaded translation JSON files into their corresponding TypeScript files"
  echo ""
  echo "Options:"
  echo "  --dry-run         Show what would be deployed without doing it"
  echo "  --clean-json      Remove JSON files after successful deployment"
  echo "  --languages LANGS Target languages to deploy (default: all found)"
  echo "  --help            Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                    # Deploy all translations"
  echo "  $0 --dry-run          # Show what would be deployed"
  echo "  $0 --clean-json       # Deploy and remove JSON files"
  echo "  $0 --languages fr,es  # Deploy specific languages"
}

# Parse arguments
DRY_RUN=false
CLEAN_JSON=false
LANGUAGES=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --clean-json)
      CLEAN_JSON=true
      shift
      ;;
    --languages)
      LANGUAGES="$2"
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

# Helper functions
log() { echo "🔍 $1"; }
success() { echo "✅ $1"; }
warning() { echo "⚠️  $1"; }
error() { echo "❌ $1"; }

# Function to merge JSON into TypeScript file
merge_translation() {
  local json_file="$1"
  local source_ts_file="$2"
  local target_ts_file="$3"
  local language="$4"
  
  log "Merging $language translation: $(basename "$json_file") → $(basename "$target_ts_file")"
  
  # Create backup of target TypeScript file if it exists
  if [[ -f "$target_ts_file" && "$DRY_RUN" == false ]]; then
    local backup_file="${target_ts_file}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$target_ts_file" "$backup_file"
    log "Created backup: $(basename "$backup_file")"
  fi
  
  # Use the merge-translations.mjs script to merge the translation
  if [[ "$DRY_RUN" == false ]]; then
    if node "$SCRIPT_DIR/merge-translations.mjs" --ts "$source_ts_file" --json "$json_file" --out "$target_ts_file" --language "$language"; then
      success "Created $language translation file: $(basename "$target_ts_file")"
      return 0
    else
      error "Failed to create $language translation"
      # Restore backup on failure if it exists
      if [[ -f "$backup_file" ]]; then
        mv "$backup_file" "$target_ts_file"
      fi
      return 1
    fi
  else
    echo "  [DRY RUN] Would create: $json_file → $target_ts_file"
    return 0
  fi
}

# Function to find all translation JSON files
find_translation_files() {
  if [[ -n "$LANGUAGES" ]]; then
    # Find files for specific languages
    local files=()
    IFS=',' read -ra LANGS <<< "$LANGUAGES"
    for lang in "${LANGS[@]}"; do
      lang=$(echo "$lang" | xargs) # trim whitespace
      while IFS= read -r file; do
        files+=("$file")
      done < <(find "$REPO_ROOT/workspaces" -name "ref-$lang.json" -type f)
    done
    # Sort and output unique files
    if [[ ${#files[@]} -gt 0 ]]; then
      printf '%s\n' "${files[@]}" | sort -u
    fi
  else
    # Find all ref-*.json files
    find "$REPO_ROOT/workspaces" -name "ref-*.json" -type f | sort
  fi
}

# Main deployment logic
log "Deploying translations to TypeScript files"
echo "    Dry Run: $DRY_RUN"
echo "    Clean JSON: $CLEAN_JSON"
if [[ -n "$LANGUAGES" ]]; then
  echo "    Languages: $LANGUAGES"
else
  echo "    Languages: all found"
fi
echo ""

# Find all translation files
translation_files=()
while IFS= read -r file; do
  translation_files+=("$file")
done < <(find_translation_files)

if [[ ${#translation_files[@]} -eq 0 ]]; then
  warning "No translation files found"
  if [[ -n "$LANGUAGES" ]]; then
    echo "Searched for languages: $LANGUAGES"
  fi
  echo "Make sure to run 'yarn i18n:download' first"
  exit 0
fi

echo "Found ${#translation_files[@]} translation files to deploy:"
for file in "${translation_files[@]}"; do
  echo "  - $(basename "$file")"
done
echo ""

# Process each translation file
deployed=0
failed=0
cleaned=0

for json_file in "${translation_files[@]}"; do
  filename=$(basename "$json_file")
  dir=$(dirname "$json_file")
  
  # Extract language from filename (ref-LANG.json)
  if [[ "$filename" =~ ref-([^.]+)\.json$ ]]; then
    language="${BASH_REMATCH[1]}"
  else
    error "Cannot extract language from filename: $filename"
    ((failed++))
    continue
  fi
  
  # Find corresponding TypeScript file (ref.ts for source, lang.ts for output)
  source_ts_file="$dir/ref.ts"
  target_ts_file="$dir/$language.ts"
  
  if [[ ! -f "$source_ts_file" ]]; then
    error "Source TypeScript file not found: $source_ts_file"
    ((failed++))
    continue
  fi
  
  # Deploy the translation
  if merge_translation "$json_file" "$source_ts_file" "$target_ts_file" "$language"; then
    ((deployed++))
    
    # Clean up JSON file if requested
    if [[ "$CLEAN_JSON" == true && "$DRY_RUN" == false ]]; then
      rm "$json_file"
      success "Removed JSON file: $filename"
      ((cleaned++))
    fi
  else
    ((failed++))
  fi
  echo ""
done

# Summary
echo "Deploy Summary:"
echo "  ✅ Successfully deployed: $deployed"
echo "  ❌ Failed: $failed"
if [[ "$CLEAN_JSON" == true ]]; then
  echo "  🗑️  JSON files cleaned: $cleaned"
fi

if [[ $failed -gt 0 ]]; then
  error "Some deployments failed"
  echo ""
  echo "Failed translations were not deployed and JSON files were kept."
  echo "Check the errors above and fix any issues before retrying."
  exit 1
else
  success "All translations deployed successfully!"
  if [[ "$CLEAN_JSON" == true ]]; then
    echo ""
    echo "JSON files have been cleaned up."
    echo "Translations are now integrated into TypeScript files."
  else
    echo ""
    echo "JSON files are still present."
    echo "Run with --clean-json to remove them after verification."
  fi
fi
