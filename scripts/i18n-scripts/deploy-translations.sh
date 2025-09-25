#!/usr/bin/env bash
set -euo pipefail

# Deploy downloaded translations directly to TypeScript files
# This script takes JSON translation files from Memsource and updates the corresponding TypeScript translation files directly

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_usage() {
  echo "Deploy Translations to TypeScript Files"
  echo ""
  echo "Usage: $0 [OPTIONS] [FILES...]"
  echo ""
  echo "Options:"
  echo "  --source-dir DIR     Directory containing downloaded translation files (default: repo root)"
  echo "  --dry-run           Show what would be updated without actually doing it"
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
  
  # Parse filename: rhdh-plugins__workspaces__WORKSPACE__plugins__PLUGIN__src__translations__ref-en-LANG-C.json
  if [[ "$filename" =~ ^rhdh-plugins__workspaces__([^_]+)__plugins__([^_]+)__src__translations__ref-en-([^-]+)-[^.]+\.json$ ]]; then
    local workspace_name="${BASH_REMATCH[1]}"
    local plugin_name="${BASH_REMATCH[2]}"
    local language="${BASH_REMATCH[3]}"
    
    # Construct target path
    local target_dir="$REPO_ROOT/workspaces/$workspace_name/plugins/$plugin_name/src/translations"
    local target_ts_file="$target_dir/$language.ts"
    
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
    
    # Check if target TypeScript file exists
    if [[ ! -f "$target_ts_file" ]]; then
      echo "    ❌ Target TypeScript file doesn't exist: $target_ts_file"
      return 1
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
      echo "    [DRY RUN] Would update: $target_ts_file with translations from $file_path"
    else
      echo "    📁 Updating: $target_ts_file"
      
      # Update the TypeScript file directly with JSON translations
      node -e "
        const fs = require('fs');
        const path = require('path');
        
        // Read files
        const tsContent = fs.readFileSync('$target_ts_file', 'utf8');
        const jsonMessages = JSON.parse(fs.readFileSync('$file_path', 'utf8'));
        
        // Find the messages object in the TypeScript file
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
        
        // Extract existing keys and values from the current TypeScript file
        const existingTranslations = {};
        const existingMessagesMatch = tsContent.match(/messages:\\s*{([\\s\\S]*?)}/);
        if (existingMessagesMatch) {
          const messagesContent = existingMessagesMatch[1];
          const keyValueRegex = new RegExp(\"'([^']+)':\\\\s*['\\\"]([^'\\\"]*)['\\\"]\", 'g');
          let match;
          while ((match = keyValueRegex.exec(messagesContent)) !== null) {
            existingTranslations[match[1]] = match[2];
          }
        }
        
        // Build new messages content - preserve existing keys, update/add from JSON
        const newMessagesLines = [];
        const allKeys = [...new Set([...Object.keys(existingTranslations), ...Object.keys(jsonMessages)])].sort();
        
        for (const key of allKeys) {
          // Use value from JSON if available, otherwise keep existing value
          const value = jsonMessages[key] || existingTranslations[key] || '';
          
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
        fs.writeFileSync('$target_ts_file', newTsContent, 'utf8');
        console.log('✅ Updated TypeScript file successfully');
        
        // Validate the syntax of the generated file
        try {
          require('child_process').execSync('node -c \"$target_ts_file\"', { stdio: 'pipe' });
          console.log('✅ Generated file has valid JavaScript syntax');
        } catch (syntaxError) {
          console.error('❌ Generated file has syntax errors:');
          console.error(syntaxError.toString());
          throw new Error('Generated TypeScript file has invalid syntax');
        }
      "
      
      if [[ $? -eq 0 ]]; then
        echo "    ✅ Successfully updated: $target_ts_file"
        
        # Clean up source file if requested
        if [[ "$CLEAN_SOURCE" == true ]]; then
          echo "    🗑️  Removed source: $file_path"
          rm "$file_path"
        fi
      else
        echo "    ❌ Failed to update: $target_ts_file"
        return 1
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
