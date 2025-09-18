#!/usr/bin/env bash
set -euo pipefail

# Clean up .bak files created by i18n sync operations
# Provides various cleanup options with safety checks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_usage() {
  echo "Clean Up Translation Backup Files"
  echo ""
  echo "Usage: $0 [OPTIONS] [DIRECTORIES...]"
  echo ""
  echo "Options:"
  echo "  --dry-run           Show what would be deleted without actually deleting"
  echo "  --older-than DAYS   Only delete .bak files older than N days (default: 0 = all)"
  echo "  --translations-only Only delete .bak files in translation directories"
  echo "  --interactive       Ask for confirmation before each deletion"
  echo "  --force             Skip all confirmations (use with caution!)"
  echo "  -h, --help          Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                                    # List all .bak files (dry-run by default)"
  echo "  $0 --force                           # Delete all .bak files immediately"
  echo "  $0 --older-than 7                   # Delete .bak files older than 7 days"
  echo "  $0 --translations-only               # Only clean translation .bak files"
  echo "  $0 --interactive                     # Ask before deleting each file"
  echo "  $0 workspaces/global-header/         # Clean specific directory"
}

# Parse arguments
DRY_RUN=true  # Default to dry-run for safety
OLDER_THAN_DAYS=0
TRANSLATIONS_ONLY=false
INTERACTIVE=false
FORCE=false
SPECIFIC_DIRS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --older-than)
      OLDER_THAN_DAYS="$2"
      shift 2
      ;;
    --translations-only)
      TRANSLATIONS_ONLY=true
      shift
      ;;
    --interactive)
      INTERACTIVE=true
      DRY_RUN=false
      shift
      ;;
    --force)
      FORCE=true
      DRY_RUN=false
      shift
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      SPECIFIC_DIRS+=("$1")
      shift
      ;;
  esac
done

# If no explicit action specified, default to dry-run
if [[ "$INTERACTIVE" == false && "$FORCE" == false ]]; then
  DRY_RUN=true
fi

echo "==> Backup File Cleanup"
echo "Mode: $([ "$DRY_RUN" == true ] && echo "DRY RUN (preview only)" || echo "ACTIVE CLEANUP")"
echo "Older than: $([ "$OLDER_THAN_DAYS" -eq 0 ] && echo "all files" || echo "$OLDER_THAN_DAYS days")"
echo "Scope: $([ "$TRANSLATIONS_ONLY" == true ] && echo "translations only" || echo "all .bak files")"
echo "Interactive: $INTERACTIVE"
echo ""

# Function to get file age in days
get_file_age_days() {
  local file="$1"
  local current_time=$(date +%s)
  local file_time
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    file_time=$(stat -f %m "$file")
  else
    # Linux
    file_time=$(stat -c %Y "$file")
  fi
  
  echo $(( (current_time - file_time) / 86400 ))
}

# Function to format file size
format_file_size() {
  local size="$1"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "$size" | awk '{
      if ($1 >= 1024*1024) printf "%.1fM", $1/(1024*1024)
      else if ($1 >= 1024) printf "%.1fK", $1/1024
      else printf "%dB", $1
    }'
  else
    # Linux
    numfmt --to=iec-i --suffix=B "$size"
  fi
}

# Function to clean up files in a directory
cleanup_directory() {
  local search_dir="$1"
  
  if [[ ! -d "$search_dir" ]]; then
    echo "  ❌ Directory not found: $search_dir"
    return 1
  fi
  
  echo "==> Scanning: $search_dir"
  
  local found_files=()
  local total_size=0
  
  # Build find command based on options
  local find_args=("$search_dir")
  
  if [[ "$TRANSLATIONS_ONLY" == true ]]; then
    find_args+=("-path" "*/translations/*.bak")
  else
    find_args+=("-name" "*.bak")
  fi
  
  find_args+=("-type" "f")
  
  # Add age filter if specified
  if [[ "$OLDER_THAN_DAYS" -gt 0 ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      find_args+=("-mtime" "+${OLDER_THAN_DAYS}")
    else
      find_args+=("-mtime" "+${OLDER_THAN_DAYS}")
    fi
  fi
  
  # Find matching files
  while IFS= read -r -d '' file; do
    if [[ -f "$file" ]]; then
      found_files+=("$file")
      local size
      if [[ "$OSTYPE" == "darwin"* ]]; then
        size=$(stat -f %z "$file")
      else
        size=$(stat -c %s "$file")
      fi
      total_size=$((total_size + size))
    fi
  done < <(find "${find_args[@]}" -print0 2>/dev/null)
  
  if [[ ${#found_files[@]} -eq 0 ]]; then
    echo "  ✅ No .bak files found"
    return 0
  fi
  
  echo "  → Found ${#found_files[@]} .bak file(s), total size: $(format_file_size $total_size)"
  echo ""
  
  local deleted=0
  local skipped=0
  local failed=0
  
  for file in "${found_files[@]}"; do
    local rel_path="${file#$REPO_ROOT/}"
    local age_days=$(get_file_age_days "$file")
    local size
    if [[ "$OSTYPE" == "darwin"* ]]; then
      size=$(stat -f %z "$file")
    else
      size=$(stat -c %s "$file")
    fi
    
    echo "  📄 $rel_path ($(format_file_size $size), ${age_days}d old)"
    
    if [[ "$DRY_RUN" == true ]]; then
      echo "    [DRY RUN] Would delete this file"
      ((deleted++))
    elif [[ "$INTERACTIVE" == true ]]; then
      echo -n "    Delete this file? [y/N]: "
      read -r response
      case "$response" in
        [yY]|[yY][eE][sS])
          if rm "$file"; then
            echo "    ✅ Deleted"
            ((deleted++))
          else
            echo "    ❌ Failed to delete"
            ((failed++))
          fi
          ;;
        *)
          echo "    ⏭️  Skipped"
          ((skipped++))
          ;;
      esac
    else
      # Force mode
      if rm "$file"; then
        echo "    ✅ Deleted"
        ((deleted++))
      else
        echo "    ❌ Failed to delete"
        ((failed++))
      fi
    fi
    echo ""
  done
  
  echo "  → Results: deleted=$deleted, skipped=$skipped, failed=$failed"
  return $failed
}

# Main execution
total_deleted=0
total_failed=0

if [[ ${#SPECIFIC_DIRS[@]} -gt 0 ]]; then
  # Clean specific directories
  for dir in "${SPECIFIC_DIRS[@]}"; do
    if cleanup_directory "$dir"; then
      ((total_deleted++))
    else
      ((total_failed++))
    fi
  done
else
  # Clean the entire repository
  cleanup_directory "$REPO_ROOT"
fi

# Summary
echo ""
echo "==> Cleanup Summary"
if [[ "$DRY_RUN" == true ]]; then
  echo "🔍 This was a preview. Use --force or --interactive to actually delete files."
  echo ""
  echo "Quick cleanup commands:"
  echo "  yarn i18n-cleanup --force                    # Delete all .bak files"
  echo "  yarn i18n-cleanup --older-than 7 --force    # Delete files older than 7 days"
  echo "  yarn i18n-cleanup --interactive              # Ask before each deletion"
else
  if [[ $total_failed -gt 0 ]]; then
    echo "❌ Some cleanup operations failed"
    exit 1
  else
    echo "🎉 Cleanup completed successfully!"
  fi
fi

# Show current .bak file count
echo ""
echo "==> Current Status"
remaining_count=0
if [[ "$TRANSLATIONS_ONLY" == true ]]; then
  remaining_count=$(find "$REPO_ROOT" -path "*/translations/*.bak" -type f | wc -l | tr -d ' ')
  echo "Translation .bak files remaining: $remaining_count"
else
  remaining_count=$(find "$REPO_ROOT" -name "*.bak" -type f | wc -l | tr -d ' ')
  echo "Total .bak files remaining: $remaining_count"
fi
