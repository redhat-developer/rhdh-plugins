#!/bin/bash
# Quick test script - tests basic CLI functionality

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$CLI_DIR"

echo "🔨 Building CLI..."
yarn build

echo ""
echo "🧪 Testing help command..."
if [ -f "dist/index.cjs.js" ]; then
    node bin/translations-cli --help > /dev/null && echo "✓ Help command works"
else
    echo "⚠ Build output not found, skipping help test"
fi

echo ""
echo "🧪 Testing generate command (dry run)..."
# Create a minimal test structure
TEST_DIR="$CLI_DIR/.quick-test"
mkdir -p "$TEST_DIR/plugins/test/src/translations"

cat > "$TEST_DIR/plugins/test/src/translations/ref.ts" << 'EOF'
import { createTranslationRef } from '@backstage/core-plugin-api/alpha';
export const messages = createTranslationRef({
  id: 'test',
  messages: { title: 'Test' },
});
EOF

cd "$TEST_DIR"
if [ -f "$CLI_DIR/dist/index.cjs.js" ]; then
    node "$CLI_DIR/bin/translations-cli" i18n generate --source-dir . --output-dir i18n > /dev/null
else
    echo "⚠ Build output not found, skipping generate test"
    exit 0
fi

if [ -f "$TEST_DIR/i18n/reference.json" ]; then
    echo "✓ Generate command works"
    if grep -q '"test"' "$TEST_DIR/i18n/reference.json"; then
        echo "✓ Generated file contains expected data"
    else
        echo "✗ Generated file missing expected data"
        exit 1
    fi
else
    echo "✗ Generate command failed - no output file"
    exit 1
fi

# Cleanup
cd "$CLI_DIR"
rm -rf "$TEST_DIR"

echo ""
echo "✅ All quick tests passed!"

