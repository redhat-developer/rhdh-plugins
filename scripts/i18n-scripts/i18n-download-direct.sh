#!/usr/bin/env bash
set -euo pipefail

# i18n Download Direct - Download translations directly to their target locations
# This eliminates the need for a separate deploy step

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_usage() {
  echo "RHDH Plugins - i18n Download Direct"
  echo ""
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Download completed translations from TMS directly to their target locations"
  echo ""
  echo "Options:"
  echo "  --dry-run         Show what would be downloaded without doing it"
  echo "  --force           Force download even if files exist"
  echo "  --languages LANGS Target languages (default: fr)"
  echo "  --release VER     RHDH release version (default: from config)"
  echo "  --help            Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                          # Download with defaults"
  echo "  $0 --dry-run                 # Check what would be downloaded"
  echo "  $0 --languages fr,es,de      # Download for multiple languages"
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

# Helper functions
log() { echo "🔍 $1"; }
success() { echo "✅ $1"; }
warning() { echo "⚠️  $1"; }
error() { echo "❌ $1"; }

# Function to determine target path from filename and target language
get_target_path() {
  local filename="$1"
  local target_lang="$2"
  
  # Parse filename: rhdh-plugins__workspaces__PLUGIN__plugins__PLUGIN__src__translations__ref-en.json
  if [[ "$filename" =~ ^rhdh-plugins__workspaces__([^_]+)__plugins__([^_]+)__src__translations__ref-en\.json$ ]]; then
    local workspace_name="${BASH_REMATCH[1]}"
    local plugin_name="${BASH_REMATCH[2]}"
    
    # Construct target path
    local target_dir="$REPO_ROOT/workspaces/$workspace_name/plugins/$plugin_name/src/translations"
    local target_file="$target_dir/ref-$target_lang.json"
    
    echo "$target_file"
    return 0
  else
    echo "ERROR: Unrecognized filename pattern: $filename" >&2
    return 1
  fi
}

# Function to download a single job directly to target location
download_job_direct() {
  local job_id="$1"
  local original_filename="$2"
  local target_lang="$3"
  
  # Determine target path
  local target_file
  if ! target_file=$(get_target_path "$original_filename"); then
    echo "    ❌ Failed to determine target path for: $original_filename"
    return 1
  fi
  
  local target_dir=$(dirname "$target_file")
  
  # Check if target directory exists
  if [[ ! -d "$target_dir" ]]; then
    echo "    ❌ Target directory doesn't exist: $target_dir"
    return 1
  fi
  
  # Check if ref.ts exists (validation)
  if [[ ! -f "$target_dir/ref.ts" ]]; then
    echo "    ⚠️  No ref.ts found in target directory: $target_dir"
    echo "    ⚠️  This might not be the correct location"
  fi
  
  if [[ "$DRY_RUN" == true ]]; then
    echo "    [DRY RUN] Would download job: $job_id → $target_file"
    return 0
  fi
  
  echo "    → Downloading job: $job_id → $target_file"
  
  # Create temp file for download
  local temp_file=$(mktemp)
  trap "rm -f '$temp_file'" EXIT
  
  # Download to temp file first
  if memsource job download --project-id "$TMS_PROJECT_ID" --job-id "$job_id" --output "$temp_file"; then
    # Move to target location
    if [[ -f "$temp_file" ]]; then
      cp "$temp_file" "$target_file"
      echo "    ✅ Downloaded: $target_file"
      return 0
    else
      echo "    ❌ Downloaded file not found: $temp_file"
      return 1
    fi
  else
    echo "    ❌ Failed to download: $job_id"
    return 1
  fi
}

# Main download logic
log "i18n Download Direct from TMS"
echo "    Languages: $LANGUAGES"
echo "    Release: $RHDH_RELEASE"
echo "    Dry Run: $DRY_RUN"
echo ""

if [[ "$DRY_RUN" == true ]]; then
  log "Dry run mode - would download translations for languages: $LANGUAGES"
  echo ""
  echo "To actually download, run:"
  echo "  $0"
  echo ""
  echo "Note: Dry run mode shows what would be downloaded but doesn't process files."
  echo "Run without --dry-run to see detailed processing and pattern matching."
  exit 0
fi

# Download translations directly to target locations
log "Downloading translations from TMS..."

# Setup memsource environment
source "$SCRIPT_DIR/memsource-setup.sh"
if ! setup_memsource_with_project "$TMS_PROJECT_ID"; then
  exit 1
fi

# Get list of jobs from TMS
log "Getting job list from TMS..."
job_list=$(memsource job list --project-id "$TMS_PROJECT_ID" --format json)

if [[ -z "$job_list" ]]; then
  error "Failed to get job list from TMS"
  exit 1
fi

# Filter jobs by language and status
IFS=',' read -ra LANG_ARRAY <<< "$LANGUAGES"
downloaded=0
failed=0

for lang in "${LANG_ARRAY[@]}"; do
  lang=$(echo "$lang" | xargs)  # Trim whitespace
  
  log "Processing language: $lang"
  
  # Get jobs for this language with COMPLETED status
  filtered_jobs=$(echo "$job_list" | jq -r ".[] | select(.target_lang == \"$lang\" and .status == \"COMPLETED\")")
  
  if [[ -z "$filtered_jobs" ]]; then
    warning "No completed jobs found for language: $lang"
    continue
  fi
  
  # Group by filename and select the latest for each file
  latest_jobs=$(echo "$filtered_jobs" | jq -s '
    group_by(.filename) | 
    map(sort_by(.date_created) | last) | 
    .[] | .uid'
  )
  
  while IFS= read -r job_id; do
    if [[ -n "$job_id" ]]; then
      # Remove quotes that jq adds
      job_id=$(echo "$job_id" | tr -d '"')
      
      # Get job details
      job_info=$(echo "$job_list" | jq -r ".[] | select(.uid == \"$job_id\")")
      job_filename=$(echo "$job_info" | jq -r '.filename')
      
      echo "Processing job: $job_id ($job_filename)"
      
      # Determine target path
      target_file=""
      if target_file=$(get_target_path "$job_filename" "$lang"); then
        target_dir=$(dirname "$target_file")
        
        # Ensure target directory exists
        mkdir -p "$target_dir"
        
        # Check if ref.ts exists (validation)
        if [[ ! -f "$target_dir/ref.ts" ]]; then
          echo "  ⚠️  No ref.ts found in target directory: $target_dir"
          echo "  ⚠️  This might not be the correct location"
        fi
        
        # Download directly to target location
        echo "  → Downloading to: $target_file"
        
        # Create temp directory for download
        temp_dir=$(mktemp -d)
        trap "rm -rf '$temp_dir'" EXIT
        
        if memsource job download --project-id "$TMS_PROJECT_ID" --job-id "$job_id" --output-dir "$temp_dir"; then
          # Find the downloaded file in the temp directory
          downloaded_file=$(find "$temp_dir" -name "*.json" | head -1)
          if [[ -n "$downloaded_file" && -f "$downloaded_file" ]]; then
            cp "$downloaded_file" "$target_file"
            echo "  ✅ Downloaded: $target_file"
            ((downloaded++))
          else
            echo "  ❌ Downloaded file not found in: $temp_dir"
            ((failed++))
          fi
        else
          echo "  ❌ Failed to download job: $job_id"
          ((failed++))
        fi
      else
        echo "  ❌ Failed to determine target path: $job_filename"
        ((failed++))
      fi
    fi
  done <<< "$latest_jobs"
done

echo ""
echo "Download Summary:"
echo "  ✅ Successfully downloaded: $downloaded"
echo "  ❌ Failed: $failed"

if [[ $failed -gt 0 ]]; then
  error "Some downloads failed"
  exit 1
else
  success "All translations downloaded directly to target locations!"
  echo ""
  echo "Files are now in their final locations:"
  echo "  - workspaces/*/plugins/*/src/translations/ref-*.json"
  echo ""
  echo "No deployment step needed - translations are ready to use!"
fi
