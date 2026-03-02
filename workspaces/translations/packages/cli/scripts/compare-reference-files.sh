#!/bin/bash
# Compare reference.json files before and after regeneration
# Usage: ./test/compare-reference-files.sh <repo-path>

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <repo-path>"
    echo "Example: $0 /Users/yicai/redhat/rhdh-plugins"
    exit 1
fi

REPO_PATH="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Find reference.json location
REF_FILE=""
if [ -f "$REPO_PATH/i18n/reference.json" ]; then
    REF_FILE="$REPO_PATH/i18n/reference.json"
elif [ -f "$REPO_PATH/workspaces/i18n/reference.json" ]; then
    REF_FILE="$REPO_PATH/workspaces/i18n/reference.json"
else
    echo "Error: reference.json not found in $REPO_PATH"
    exit 1
fi

BACKUP_FILE="${REF_FILE}.backup"

echo "🔍 Comparing reference.json files..."
echo "Repository: $REPO_PATH"
echo "File: $REF_FILE"
echo ""

# Create backup if it doesn't exist
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Creating backup..."
    cp "$REF_FILE" "$BACKUP_FILE"
fi

# Generate new file
echo "Generating new reference.json..."
cd "$REPO_PATH"
if [ -f "workspaces/i18n/reference.json" ]; then
    OUTPUT_DIR="workspaces/i18n"
else
    OUTPUT_DIR="i18n"
fi

node "$CLI_DIR/bin/translations-cli" i18n generate --source-dir . --output-dir "$OUTPUT_DIR" > /dev/null 2>&1

# Compare
echo ""
if cmp -s "$BACKUP_FILE" "$REF_FILE"; then
    echo "✅ Files are IDENTICAL - no upload needed"
    exit 0
else
    echo "⚠️  Files DIFFER - upload needed"
    echo ""
    echo "Summary:"
    if command -v jq &> /dev/null; then
        BACKUP_PLUGINS=$(jq 'keys | length' "$BACKUP_FILE")
        NEW_PLUGINS=$(jq 'keys | length' "$REF_FILE")
        BACKUP_KEYS=$(jq '[.[] | .en | keys | length] | add' "$BACKUP_FILE")
        NEW_KEYS=$(jq '[.[] | .en | keys | length] | add' "$REF_FILE")
        
        echo "  Plugins: $BACKUP_PLUGINS → $NEW_PLUGINS"
        echo "  Keys: $BACKUP_KEYS → $NEW_KEYS"
        
        if [ "$NEW_KEYS" -gt "$BACKUP_KEYS" ]; then
            DIFF=$((NEW_KEYS - BACKUP_KEYS))
            echo "  Added: +$DIFF keys"
        elif [ "$NEW_KEYS" -lt "$BACKUP_KEYS" ]; then
            DIFF=$((BACKUP_KEYS - NEW_KEYS))
            echo "  Removed: -$DIFF keys"
        fi
    fi
    
    echo ""
    echo "MD5 hashes:"
    md5 "$BACKUP_FILE" "$REF_FILE" 2>/dev/null || md5sum "$BACKUP_FILE" "$REF_FILE"
    
    echo ""
    echo "To see detailed differences:"
    echo "  diff -u $BACKUP_FILE $REF_FILE"
    
    exit 1
fi

