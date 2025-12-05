# Testing Guide for Translations CLI

This directory contains testing utilities and guides for the translations CLI.

## Quick Start

### Run Quick Tests (Fast)

```bash
yarn test:quick
```

Tests basic functionality in under 10 seconds.

### Run Integration Tests (Comprehensive)

```bash
yarn test:integration
```

Tests full workflow with real file structures.

### Run Unit Tests (If Available)

```bash
yarn test
```

Runs vitest unit tests.

### Manual Testing

Follow the checklist in `manual-test-checklist.md`:

```bash
yarn test:manual
# Then follow the checklist
```

## Test Files

- `test-helpers.ts` - Utility functions for creating test fixtures
- `generate.test.ts` - Unit tests for generate command
- `integration-test.sh` - Full integration test script
- `quick-test.sh` - Quick smoke tests
- `manual-test-checklist.md` - Comprehensive manual testing guide

## Testing Workflow

### Before Every Commit

```bash
# Quick smoke test
yarn test:quick
```

### Before PR

```bash
# Full integration test
yarn test:integration

# Manual testing (follow checklist)
# See test/manual-test-checklist.md
```

### Before Release

1. Run all automated tests
2. Complete manual testing checklist
3. Test in real repositories:
   - community-plugins
   - rhdh-plugins
   - Any other target repos

## Testing in Real Repositories

### Test in community-plugins

```bash
cd /Users/yicai/redhat/community-plugins
translations-cli i18n generate --source-dir . --output-dir i18n

# Verify:
# - reference.json only contains English
# - No non-English words (Italian, German, etc.)
# - All plugins are included
```

### Test in rhdh-plugins

```bash
cd /Users/yicai/redhat/rhdh-plugins/workspaces/translations
translations-cli i18n generate --source-dir . --output-dir i18n

# Verify output
```

## Common Test Scenarios

### 1. Generate Command

- ✅ Creates reference.json
- ✅ Only includes English keys
- ✅ Excludes language files (de.ts, es.ts, etc.)
- ✅ Excludes createTranslationMessages files
- ✅ Handles nested keys correctly

### 2. Filtering

- ✅ Only includes createTranslationRef files
- ✅ Excludes createTranslationMessages (may contain non-English)
- ✅ Excludes createTranslationResource
- ✅ No non-English words in output

### 3. Error Handling

- ✅ Invalid commands show helpful errors
- ✅ Missing files show helpful errors
- ✅ Invalid config shows helpful errors

## Troubleshooting Tests

### Tests Fail to Run

```bash
# Ensure dependencies are installed
yarn install

# Rebuild
yarn build
```

### Integration Test Fails

```bash
# Check if bin file is executable
chmod +x bin/translations-cli

# Check if script is executable
chmod +x test/integration-test.sh
```

### Permission Errors

```bash
# Make scripts executable
chmod +x test/*.sh
```
