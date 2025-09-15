#!/usr/bin/env bash
set -euo pipefail

# Sync JSON translations with TypeScript translation files
# This script updates existing .ts translation files with new translations from .json files

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_usage() {
  echo "Sync JSON Translations with TypeScript Files"
  echo ""
  echo "Usage: $0 [OPTIONS] [DIRECTORIES...]"
  echo ""
  echo "Options:"
  echo "  --dry-run           Show what would be updated without making changes"
  echo "  --backup            Create backup files before updating (.bak extension)"
  echo "  --language LANG     Only sync specific language (e.g., fr, es, de)"
  echo "  --plugin PLUGIN     Only sync specific plugin directory"
  echo "  -h, --help          Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                                    # Sync all plugins and languages"
  echo "  $0 --language fr                     # Sync only French translations"
  echo "  $0 --plugin global-header            # Sync only global-header plugin"
  echo "  $0 --dry-run                         # Preview changes without applying"
  echo "  $0 workspaces/global-header/         # Sync specific directory"
}

# Parse arguments
DRY_RUN=false
CREATE_BACKUP=false
TARGET_LANGUAGE=""
TARGET_PLUGIN=""
SPECIFIC_DIRS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --backup)
      CREATE_BACKUP=true
      shift
      ;;
    --language)
      TARGET_LANGUAGE="$2"
      shift 2
      ;;
    --plugin)
      TARGET_PLUGIN="$2"
      shift 2
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

echo "==> Translation Sync"
echo "Dry Run: $DRY_RUN"
echo "Create Backup: $CREATE_BACKUP"
[[ -n "$TARGET_LANGUAGE" ]] && echo "Target Language: $TARGET_LANGUAGE"
[[ -n "$TARGET_PLUGIN" ]] && echo "Target Plugin: $TARGET_PLUGIN"
echo ""

# Function to extract messages from TypeScript file
extract_ts_messages() {
  local ts_file="$1"
  
  # Use node to parse the TypeScript file and extract the messages object
  node -e "
    const fs = require('fs');
    const content = fs.readFileSync('$ts_file', 'utf8');
    
    // Extract the messages object using regex
    const messagesMatch = content.match(/messages:\s*{([^}]+(?:{[^}]*}[^}]*)*?)}/s);
    if (!messagesMatch) {
      console.error('Could not find messages object in $ts_file');
      process.exit(1);
    }
    
    const messagesContent = messagesMatch[1];
    
    // Parse individual message entries
    const messages = {};
    const messageRegex = ['\"']([^'\"]+)['\"']:\s*['\"]((?:[^'\"\\\\]|\\\\.)*)['\"]/g;
    let match;
    
    while ((match = messageRegex.exec(messagesContent)) !== null) {
      const key = match[1];
      const value = match[2].replace(/\\\\'/g, \"'\").replace(/\\\\\"/g, '\"');
      messages[key] = value;
    }
    
    console.log(JSON.stringify(messages, null, 2));
  " 2>/dev/null || echo "{}"
}

# Function to update TypeScript file with new translations
update_ts_file() {
  local ts_file="$1"
  local json_file="$2"
  local language="$3"
  
  echo "  → Syncing: $(basename "$ts_file") with $(basename "$json_file")"
  
  # Read JSON translations
  if [[ ! -f "$json_file" ]]; then
    echo "    ❌ JSON file not found: $json_file"
    return 1
  fi
  
  local json_messages
  json_messages=$(cat "$json_file")
  
  if [[ "$DRY_RUN" == true ]]; then
    echo "    [DRY RUN] Would update TypeScript file with JSON translations"
    
    # Show a few example changes
    local current_messages
    current_messages=$(extract_ts_messages "$ts_file")
    
    # Compare a few keys to show differences
    local sample_keys
    sample_keys=$(echo "$json_messages" | jq -r 'keys[0:3][]' 2>/dev/null || echo "")
    
    if [[ -n "$sample_keys" ]]; then
      echo "    [DRY RUN] Sample changes:"
      while IFS= read -r key; do
        local json_value current_value
        json_value=$(echo "$json_messages" | jq -r ".[\"$key\"]" 2>/dev/null || echo "")
        current_value=$(echo "$current_messages" | jq -r ".[\"$key\"] // empty" 2>/dev/null || echo "")
        
        if [[ -n "$json_value" && "$json_value" != "$current_value" ]]; then
          echo "      '$key': '$current_value' → '$json_value'"
        fi
      done <<< "$sample_keys"
    fi
    
    return 0
  fi
  
  # Create backup if requested
  if [[ "$CREATE_BACKUP" == true ]]; then
    cp "$ts_file" "$ts_file.bak"
    echo "    💾 Created backup: $ts_file.bak"
  fi
  
  # Update the TypeScript file
  node -e "
    const fs = require('fs');
    const path = require('path');
    
    // Read files
    const tsContent = fs.readFileSync('$ts_file', 'utf8');
    const jsonMessages = JSON.parse(fs.readFileSync('$json_file', 'utf8'));
    
    // Find the messages object in the TypeScript file using a more robust approach
    // Look for 'messages: {' and then find the matching closing brace
    const messagesStartMatch = tsContent.match(/(messages:\s*{)/);
    if (!messagesStartMatch) {
      console.error('Could not find messages object start in TypeScript file');
      process.exit(1);
    }
    
    const beforeMessages = messagesStartMatch[1];
    const startIndex = messagesStartMatch.index + messagesStartMatch[0].length;
    
    // Find the matching closing brace by counting braces
    let braceCount = 1;
    let endIndex = startIndex;
    let inString = false;
    let stringChar = '';
    let escaped = false;
    
    for (let i = startIndex; i < tsContent.length && braceCount > 0; i++) {
      const char = tsContent[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\\\') {
        escaped = true;
        continue;
      }
      
      if (inString) {
        if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      } else {
        if (char === '\"' || char === \"'\") {
          inString = true;
          stringChar = char;
        } else if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
        }
      }
      
      endIndex = i;
    }
    
    if (braceCount !== 0) {
      console.error('Could not find matching closing brace for messages object');
      process.exit(1);
    }
    
    const afterMessages = '}';
    const fullMessagesMatch = tsContent.substring(messagesStartMatch.index, endIndex + 1);
    
    // Build new messages content
    const newMessagesLines = [];
    const sortedKeys = Object.keys(jsonMessages).sort();
    
    for (const key of sortedKeys) {
      const value = jsonMessages[key];
      
      // Validate the key and value
      if (typeof key !== 'string' || typeof value !== 'string') {
        console.error(\`Invalid key-value pair: \${key} = \${value}\`);
        continue;
      }
      
      // Check for problematic characters that might cause issues
      const problematicChars = /[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/;
      if (problematicChars.test(value)) {
        console.warn(\`Warning: Translation for '\${key}' contains control characters that may cause issues\`);
      }
      
      // Properly escape special characters for JavaScript strings
      // Use JSON.stringify to handle most escaping, then adjust for single quotes
      let escapedValue = JSON.stringify(value);
      // Remove the outer double quotes added by JSON.stringify
      escapedValue = escapedValue.slice(1, -1);
      // Convert double quotes to single quotes (since we're using single-quoted strings)
      escapedValue = escapedValue.replace(/\\\\\"/g, '\"').replace(/'/g, \"\\\\'\");
      
      // Format the line with proper indentation
      if (value.length > 60) {
        // Multi-line format for long strings
        newMessagesLines.push(\`    '\${key}':\`);
        newMessagesLines.push(\`      '\${escapedValue}',\`);
      } else {
        // Single line format
        newMessagesLines.push(\`    '\${key}': '\${escapedValue}',\`);
      }
    }
    
    // Construct the new content
    const newMessagesContent = newMessagesLines.join('\\n');
    const newMessagesObject = beforeMessages + '\\n' + newMessagesContent + '\\n  ' + afterMessages;
    const newTsContent = tsContent.replace(
      fullMessagesMatch,
      newMessagesObject
    );
    
    // Write the updated file
    fs.writeFileSync('$ts_file', newTsContent, 'utf8');
    console.log('✅ Updated TypeScript file successfully');
    
    // Validate the syntax of the generated file
    try {
      require('child_process').execSync('node -c \"$ts_file\"', { stdio: 'pipe' });
      console.log('✅ Generated file has valid JavaScript syntax');
    } catch (syntaxError) {
      console.error('❌ Generated file has syntax errors:');
      console.error(syntaxError.toString());
      throw new Error('Generated TypeScript file has invalid syntax');
    }
  "
  
  if [[ $? -eq 0 ]]; then
    echo "    ✅ Successfully updated: $ts_file"
    return 0
  else
    echo "    ❌ Failed to update: $ts_file"
    return 1
  fi
}

# Function to sync translations in a directory
sync_directory() {
  local dir="$1"
  
  if [[ ! -d "$dir" ]]; then
    echo "  ❌ Directory not found: $dir"
    return 1
  fi
  
  echo "==> Syncing translations in: $dir"
  
  local synced=0
  local failed=0
  
  # Find all ref-*.json files (translations from TMS)
  while IFS= read -r -d '' json_file; do
    local filename=$(basename "$json_file")
    
    # Extract language from filename: ref-fr.json → fr
    if [[ "$filename" =~ ^ref-([a-z]{2}(-[A-Z]{2})?)\.json$ ]]; then
      local language="${BASH_REMATCH[1]}"
      
      # Skip if we're targeting a specific language and this isn't it
      if [[ -n "$TARGET_LANGUAGE" && "$language" != "$TARGET_LANGUAGE" ]]; then
        continue
      fi
      
      # Look for corresponding TypeScript file
      local ts_file="$(dirname "$json_file")/$language.ts"
      
      if [[ -f "$ts_file" ]]; then
        echo ""
        echo "Processing language: $language"
        if update_ts_file "$ts_file" "$json_file" "$language"; then
          ((synced++))
        else
          ((failed++))
        fi
      else
        echo "  ⚠️  No TypeScript file found for $language: $ts_file"
      fi
    fi
  done < <(find "$dir" -name "ref-*.json" -print0)
  
  echo ""
  echo "  → Synced: $synced, Failed: $failed"
  
  return $failed
}

# Main execution
total_synced=0
total_failed=0

if [[ ${#SPECIFIC_DIRS[@]} -gt 0 ]]; then
  # Sync specific directories provided as arguments
  for dir in "${SPECIFIC_DIRS[@]}"; do
    if sync_directory "$dir"; then
      ((total_synced++))
    else
      ((total_failed++))
    fi
  done
else
  # Auto-discover translation directories
  echo "==> Discovering translation directories..."
  
  # Find all directories containing both ref.ts and translation files
  translation_dirs=()
  
  while IFS= read -r -d '' dir; do
    # Check if this directory has both ref.ts and some .ts translation files
    if [[ -f "$dir/ref.ts" ]] && ls "$dir"/*.ts >/dev/null 2>&1; then
      # Skip if targeting specific plugin and this doesn't match
      if [[ -n "$TARGET_PLUGIN" ]]; then
        plugin_name=$(basename "$(dirname "$(dirname "$dir")")")
        if [[ "$plugin_name" != "$TARGET_PLUGIN" ]]; then
          continue
        fi
      fi
      
      translation_dirs+=("$dir")
    fi
  done < <(find "$REPO_ROOT/workspaces" -name "translations" -type d -print0)
  
  echo "  → Found ${#translation_dirs[@]} translation directories"
  echo ""
  
  for dir in "${translation_dirs[@]}"; do
    if sync_directory "$dir"; then
      ((total_synced++))
    else
      ((total_failed++))
    fi
  done
fi

# Summary
echo ""
echo "==> Sync Summary"
echo "  ✅ Successfully synced: $total_synced directories"
echo "  ❌ Failed: $total_failed directories"

if [[ $total_failed -gt 0 ]]; then
  echo ""
  echo "❌ Some sync operations failed. Please check the errors above."
  exit 1
else
  echo ""
  echo "🎉 All translations synced successfully!"
  
  if [[ "$CREATE_BACKUP" == true ]]; then
    echo "💾 Backup files created with .bak extension"
  fi
  
  if [[ "$DRY_RUN" == true ]]; then
    echo "🔍 This was a dry run. Use without --dry-run to apply changes."
  fi
fi
