#!/bin/bash
# Test the CLI in a real repository
# Usage: ./test/real-repo-test.sh <repo-path>

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <repo-path>"
    echo "Example: $0 /Users/yicai/redhat/community-plugins"
    exit 1
fi

REPO_PATH="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ ! -d "$REPO_PATH" ]; then
    echo "Error: Repository path does not exist: $REPO_PATH"
    exit 1
fi

echo "🔨 Building CLI..."
cd "$CLI_DIR"
yarn build

echo ""
echo "🧪 Testing in repository: $REPO_PATH"
cd "$REPO_PATH"

# Test generate
echo "Running generate command..."
node "$CLI_DIR/bin/translations-cli" i18n generate --source-dir . --output-dir i18n

# Check output
if [ -f "i18n/reference.json" ]; then
    echo "✓ reference.json created"
    
    # Check for non-English words
    if grep -qi "eventi\|panoramica\|servizi\|richieste\|macchina\|caricamento\|riprova\|chiudi" i18n/reference.json; then
        echo "⚠ WARNING: Non-English words found in reference.json!"
        echo "This should only contain English translations."
    else
        echo "✓ No non-English words detected"
    fi
    
    # Show summary
    echo ""
    echo "📊 Summary:"
    PLUGIN_COUNT=$(jq 'keys | length' i18n/reference.json 2>/dev/null || echo "0")
    echo "  Plugins: $PLUGIN_COUNT"
    
    if command -v jq &> /dev/null; then
        TOTAL_KEYS=$(jq '[.[] | .en | keys | length] | add' i18n/reference.json 2>/dev/null || echo "0")
        echo "  Total keys: $TOTAL_KEYS"
    fi
else
    echo "✗ reference.json was not created"
    exit 1
fi

echo ""
echo "✅ Test completed successfully!"

