#!/bin/bash
# Integration test script for translations-cli
# This script tests the CLI in a real-world scenario

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_DIR="$CLI_DIR/.integration-test"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}✓${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo_error() {
    echo -e "${RED}✗${NC} $1"
}

cleanup() {
    if [ -d "$TEST_DIR" ]; then
        echo_info "Cleaning up test directory..."
        rm -rf "$TEST_DIR"
    fi
}

trap cleanup EXIT

# Build CLI
echo_info "Building CLI..."
cd "$CLI_DIR"
yarn build

# Create test directory structure
echo_info "Creating test fixture..."
mkdir -p "$TEST_DIR/plugins/test-plugin/src/translations"
mkdir -p "$TEST_DIR/i18n"

# Create ref.ts (English reference)
cat > "$TEST_DIR/plugins/test-plugin/src/translations/ref.ts" << 'EOF'
import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

export const testPluginMessages = createTranslationRef({
  id: 'test-plugin',
  messages: {
    title: 'Test Plugin',
    description: 'This is a test plugin',
    button: {
      save: 'Save',
      cancel: 'Cancel',
    },
  },
});
EOF

# Create de.ts (German - should be excluded)
cat > "$TEST_DIR/plugins/test-plugin/src/translations/de.ts" << 'EOF'
import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { testPluginMessages } from './ref';

export default createTranslationMessages({
  ref: testPluginMessages,
  messages: {
    title: 'Test Plugin (German)',
    description: 'Dies ist ein Test-Plugin',
  },
});
EOF

# Create it.ts (Italian - should be excluded)
cat > "$TEST_DIR/plugins/test-plugin/src/translations/it.ts" << 'EOF'
import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { testPluginMessages } from './ref';

export default createTranslationMessages({
  ref: testPluginMessages,
  messages: {
    title: 'Plugin di Test',
    description: 'Questo è un plugin di test',
  },
});
EOF

# Test generate command
echo_info "Testing generate command..."
cd "$TEST_DIR"
node "$CLI_DIR/bin/translations-cli" i18n generate \
  --source-dir . \
  --output-dir i18n

# Verify output file exists
if [ ! -f "$TEST_DIR/i18n/reference.json" ]; then
    echo_error "reference.json was not created!"
    exit 1
fi
echo_info "reference.json created"

# Verify structure
if ! grep -q '"test-plugin"' "$TEST_DIR/i18n/reference.json"; then
    echo_error "test-plugin not found in reference.json!"
    exit 1
fi
echo_info "test-plugin found in reference.json"

# Verify English keys are present
if ! grep -q '"title": "Test Plugin"' "$TEST_DIR/i18n/reference.json"; then
    echo_error "English title not found!"
    exit 1
fi
echo_info "English keys found"

# Verify non-English words are NOT present
if grep -q "Dies ist" "$TEST_DIR/i18n/reference.json"; then
    echo_error "German text found in reference.json!"
    exit 1
fi
if grep -q "Plugin di Test" "$TEST_DIR/i18n/reference.json"; then
    echo_error "Italian text found in reference.json!"
    exit 1
fi
echo_info "Non-English words correctly excluded"

# Test help command
echo_info "Testing help command..."
node "$CLI_DIR/bin/translations-cli" i18n --help > /dev/null
echo_info "Help command works"

# Test init command
echo_info "Testing init command..."
cd "$TEST_DIR"
node "$CLI_DIR/bin/translations-cli" i18n init
if [ ! -f "$TEST_DIR/.i18n.config.json" ]; then
    echo_error ".i18n.config.json was not created!"
    exit 1
fi
echo_info "init command works"

echo_info "All integration tests passed! ✓"

